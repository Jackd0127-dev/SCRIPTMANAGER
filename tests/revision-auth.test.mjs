import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistoryHandler } from '../server/script-history-handler.js';
import { TransactionDatabase } from './helpers/transaction-database.mjs';

const response=()=>({statusCode:200,setHeader(){},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}});
const request=(body,headers={})=>({method:'POST',headers:{origin:'https://scriptai.space','content-type':'application/json',authorization:'Bearer signed.token.value',...headers},body});
const workspace={projects:[],scripts:[{id:'demo',name:'Private test',blocks:[{id:'b',text:'one'}]}],settings:{},apid:null,asid:'demo',view:'full'};

test('history/save/restore use revocation-checked Admin identity when the browser API key rejects server lookup',async t=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:false,json:async()=>({error:{message:'API_KEY_HTTP_REFERRER_BLOCKED'}})}));
 const db=new TransactionDatabase();db.seed('owner',{...workspace,scripts:[]});let verified=0;
 const auth={async verifyIdToken(token,revoked){assert.equal(token,'signed.token.value');assert.equal(revoked,true);verified++;return {uid:'owner'};},async getUser(uid){assert.equal(uid,'owner');return {uid,emailVerified:true,providerData:[{providerId:'password'}]};}};
 const handler=createHistoryHandler({database:()=>db,auth:()=>auth});
 const call=async body=>{const r=response();await handler(request(body),r);return r;};
 assert.equal((await call({action:'save',operationId:'first',expectedWorkspaceVersion:0,workspace})).statusCode,200);
 assert.equal((await call({action:'history',scriptId:'demo'})).body.currentVersion,1);
 assert.equal((await call({action:'restore',scriptId:'demo',version:1,expectedRecordVersion:1,operationId:'restore'})).statusCode,200);
 assert.equal(verified,3);assert.equal(globalThis.fetch.mock.callCount(),0);
});

test('revision Admin identity retains origin, account-verification and invalid-token guards',async()=>{
 const db=new TransactionDatabase();db.seed('owner',workspace);
 const body={action:'history',scriptId:'demo'};
 const invoke=async(auth,headers={})=>{const r=response();await createHistoryHandler({database:()=>db,auth:()=>auth})(request(body,headers),r);return r;};
 const valid={verifyIdToken:async()=>({uid:'owner'}),getUser:async()=>({uid:'owner',emailVerified:true,providerData:[{providerId:'password'}]})};
 assert.equal((await invoke(valid,{origin:'https://attacker.example'})).statusCode,403);
 assert.equal((await invoke(valid,{'content-type':'text/plain'})).statusCode,415);
 assert.equal((await invoke(valid,{authorization:''})).statusCode,401);
 assert.equal((await invoke({...valid,getUser:async()=>({uid:'owner',emailVerified:false,providerData:[{providerId:'password'}]})})).statusCode,401);
 assert.equal((await invoke({...valid,getUser:async()=>({uid:'owner',emailVerified:false,providerData:[{providerId:'google.com'}]})})).statusCode,200);
 for(const code of ['auth/id-token-expired','auth/id-token-revoked','auth/invalid-id-token','auth/user-disabled','auth/user-not-found']){
  assert.equal((await invoke({...valid,verifyIdToken:async()=>{throw Object.assign(new Error('invalid'),{code});}})).statusCode,401);
 }
 assert.equal((await invoke({...valid,verifyIdToken:async()=>{throw new Error('network unavailable');}})).statusCode,503);
 assert.equal(db.writes,0);
});
