import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionDatabase } from './helpers/transaction-database.mjs';
import { createHistoryHandler } from '../server/script-history-handler.js';
import { commitWorkspace, readHistory } from '../server/revision-store.js';
const patch=()=>({scripts:[{id:'demo',name:'NON-PUBLIC DEMO',blocks:[{id:'b',type:'speech',text:'v1'}],novasFlow:{origin:'https://content.novasagency.com',contentId:'content-demo'},status:'draft'},{id:'other',name:'Do not edit',blocks:[]}],projects:[],settings:{theme:'dark'},view:'full',asid:'demo',apid:null});
const res=()=>({statusCode:200,setHeader(){},status(v){this.statusCode=v;return this;},json(body){this.body=body;return this;}});
const request=body=>({method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json'},body});
async function call(handler,body){const response=res();await handler(request(body),response);return response;}
function setup(){const db=new TransactionDatabase();db.seed('owner',{...patch(),scripts:[],privateUnrelated:'preserve'});return {db,handler:createHistoryHandler({database:()=>db,authorize:async()=>({uid:'owner'})})};}
test('durable v1 → v2 → reopen → v1 restored as v3, v2 and links survive',async()=>{
 const {db,handler}=setup();let p=patch();
 let r=await call(handler,{action:'save',operationId:'one',expectedWorkspaceVersion:0,workspace:p});assert.equal(r.statusCode,200);
 const reopened=(await db.doc('users/owner').get()).data();p=patch();p.scripts=structuredClone(reopened.scripts);p.scripts[0].blocks[0].text='v2';
 r=await call(handler,{action:'save',operationId:'two',expectedWorkspaceVersion:1,workspace:p});assert.equal(r.statusCode,200);
 // New handler instance stands for reopening the account; history is not in browser state.
 const fresh=createHistoryHandler({database:()=>db,authorize:async()=>({uid:'owner'})});
 r=await call(fresh,{action:'history',scriptId:'demo'});assert.deepEqual(r.body.revisions.map(v=>v.version),[2,1]);
 const restore={action:'restore',operationId:'restore-one',scriptId:'demo',version:1,expectedRecordVersion:2};
 r=await call(fresh,restore);assert.equal(r.statusCode,200);
 const final=(await db.doc('users/owner').get()).data();assert.equal(final.scripts[0].recordVersion,3);assert.equal(final.scripts[0].blocks[0].text,'v1');
 assert.deepEqual(final.scripts[0].novasFlow,p.scripts[0].novasFlow);assert.deepEqual(final.scripts[1],reopened.scripts[1]);assert.equal(final.privateUnrelated,'preserve');
 assert.deepEqual((await readHistory(db,'owner','demo')).revisions.map(v=>v.version),[3,2,1]);
 const writes=db.writes;r=await call(fresh,restore);assert.equal(r.body.replayed,true);assert.equal(db.writes,writes);
 r=await call(fresh,{...restore,operationId:'stale'});assert.equal(r.statusCode,409);
 r=await call(fresh,{action:'save',operationId:'stale-save',expectedWorkspaceVersion:1,workspace:p});assert.equal(r.statusCode,409);
});
test('failed transaction preserves last valid body/history; exact retry adds one revision only',async()=>{
 const {db,handler}=setup(), input={action:'save',operationId:'save',expectedWorkspaceVersion:0,workspace:patch()};
 const before=structuredClone(db.documents);db.failNext=true;
 assert.equal((await call(handler,input)).statusCode,500);assert.deepEqual(db.documents,before);
 assert.equal((await call(handler,input)).statusCode,200);const count=db.writes;
 assert.equal((await call(handler,input)).body.replayed,true);assert.equal(db.writes,count);
 assert.equal((await call(handler,{...input,workspace:{...input.workspace,view:'notes'}})).statusCode,409);
});
test('concurrent transaction retry rejects stale state and preserves intervening edit',async()=>{
 const {db,handler}=setup();db.beforeCommit=async database=>{const d=database.documents.get('users/owner');d.scriptWriteVersion=1;d.privateUnrelated='newer';database.version++;};
 assert.equal((await call(handler,{action:'save',operationId:'race',expectedWorkspaceVersion:0,workspace:patch()})).statusCode,409);
 assert.equal(db.documents.get('users/owner').privateUnrelated,'newer');assert.equal(db.documents.size,1);
});
test('unauthenticated, wrong-origin, cross-owner and supplied owner IDs cannot read or restore history',async()=>{
 const {db,handler}=setup();await call(handler,{action:'save',operationId:'one',expectedWorkspaceVersion:0,workspace:patch()});
 const real=createHistoryHandler({database:()=>db});
 for(const body of [{action:'history',scriptId:'demo'},{action:'restore',operationId:'x',scriptId:'demo',version:1,expectedRecordVersion:1}]){
  assert.equal((await call(real,body)).statusCode,401);
  const r=res();await real({...request(body),headers:{origin:'https://attacker.example'}},r);assert.equal(r.statusCode,403);
  const other=createHistoryHandler({database:()=>db,authorize:async()=>({uid:'other-owner'})});assert.equal((await call(other,body)).statusCode,404);
  assert.equal((await call(handler,{...body,ownerId:'other-owner'})).statusCode,422);
 }
});
test('legacy baseline is captured inside transaction; manual save cannot change reciprocal identity',async()=>{
 const {db,handler}=setup();db.seed('owner',patch());const p=patch();p.scripts[0].notes='v2';
 assert.equal((await call(handler,{action:'save',operationId:'legacy',expectedWorkspaceVersion:0,workspace:p})).statusCode,200);
 assert.deepEqual((await readHistory(db,'owner','demo')).revisions.map(v=>v.version),[2,1]);
 p.scripts[0].novasFlow.contentId='wrong';assert.equal((await call(handler,{action:'save',operationId:'wrong-link',expectedWorkspaceVersion:1,workspace:p})).statusCode,409);
});
test('an identical-content earlier revision still restores as a new version; retry after a later edit conflicts',async()=>{
 const {db,handler}=setup(),p=patch();
 const first={action:'save',operationId:'first',expectedWorkspaceVersion:0,workspace:p};await call(handler,first);
 p.scripts[0].status='recorded';await call(handler,{action:'save',operationId:'status',expectedWorkspaceVersion:1,workspace:p});
 const restore={action:'restore',operationId:'restore',scriptId:'demo',version:1,expectedRecordVersion:2};
 assert.equal((await call(handler,restore)).statusCode,200);
 const now=db.documents.get('users/owner');assert.equal(now.scripts[0].recordVersion,3);assert.equal(now.scripts[0].status,'recorded');
 assert.equal((await call(handler,first)).statusCode,409);
});
test('reconnecting the same content identity may refresh metadata without changing the link',async()=>{
 const {db,handler}=setup();await call(handler,{action:'save',operationId:'initial',expectedWorkspaceVersion:0,workspace:patch()});
 const next=patch();next.scripts[0].novasFlow.syncedAt='2026-09-27T22:00:00.000Z';next.scripts[0].novasFlow.contentTitle='Updated content label';
 assert.equal((await call(handler,{action:'save',operationId:'reconnect',expectedWorkspaceVersion:1,workspace:next})).statusCode,200);
 assert.equal(db.documents.get('users/owner').scripts[0].novasFlow.contentId,'content-demo');
});
