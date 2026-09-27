import { TransactionDatabase } from "./helpers/transaction-database.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { FieldValue } from "firebase-admin/firestore";
import { STAFF_COOKIE, HANDOFF_COOKIE, createHandoff, readHandoff, verifyStaffRequest, opaque } from "../server/staff-session.js";
import { authorizeAiRequest } from "../server/request-security.js";
import { handleStaff, workspacePatch } from "../server/staff-handler.js";
const env = { ...process.env };
function enable() { process.env.SCRIPTAI_STAFF_LOGIN_ENABLED="true"; process.env.CENTRAL_IDENTITY_MODE="dual"; process.env.STAFF_SCRIPTAI_INTROSPECTION_SECRET="synthetic-secret-".repeat(4); }
function restore() { for(const key of ["SCRIPTAI_STAFF_LOGIN_ENABLED","CENTRAL_IDENTITY_MODE","STAFF_SCRIPTAI_INTROSPECTION_SECRET"]) { if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key]; } }
const request = (action, method="GET", more={}) => ({ method, query:{action}, headers:{origin:"https://scriptai.space", "content-type":"application/json"}, ...more });
function response() { return { code:200, headers:{}, setHeader(k,v){this.headers[k]=v;}, status(code){this.code=code;return this;}, json(body){this.body=body;return this;}, redirect(code,url){this.code=code;this.url=url;return this;} }; }
test("staff cookies use signed state and PKCE without sharing Firebase credentials",()=>{
 enable();try { const flow=createHandoff();assert.equal(readHandoff(flow.value,flow.state)?.state,flow.state);assert.equal(readHandoff(flow.value,opaque()),null);assert.equal(readHandoff(flow.value+"x",flow.state),null); }finally{restore();}
});
test("staff verification requires exact app, audience, existing enabled user and existing workspace",async()=>{
 enable();try {
  const req=request("session","GET",{headers:{cookie:`${STAFF_COOKIE}=${opaque()}`}});
  const valid={app:"scriptai",audience:"https://api.scriptai.space",role:"admin",legacyUserId:"existing-owner",identityVersion:1,entitlementVersion:2};
  let grant=valid, enabled=true, exists=true; const deps={centralRequest:async()=>Response.json(grant),auth:{getUser:async uid=>{assert.equal(uid,"existing-owner");return {emailVerified:true,disabled:!enabled};}},database:{collection:()=>({doc:uid=>{assert.equal(uid,"existing-owner");return {get:async()=>({exists,data:()=>({scripts:[]})})};}})}};
  assert.equal((await verifyStaffRequest(req,deps)).uid,"existing-owner");
  for(const invalid of [{...valid,app:"flow"},{...valid,audience:"https://api.content.novasagency.com"},{...valid,legacyUserId:"../other"},{...valid,role:"viewer"}]) {grant=invalid;assert.equal(await verifyStaffRequest(req,deps),null);}
  grant=valid;enabled=false;assert.equal(await verifyStaffRequest(req,deps),null);enabled=true;exists=false;assert.equal(await verifyStaffRequest(req,deps),null);process.env.SCRIPTAI_STAFF_LOGIN_ENABLED="false";assert.equal(await verifyStaffRequest(req,deps),null);
 }finally{restore();}
});
test("callback rejects mismatched browser state before any code exchange",async()=>{
 enable();try { let exchanges=0;const res=response();await handleStaff(request("callback","GET",{query:{action:"callback",state:opaque(),code:opaque()},headers:{cookie:`${HANDOFF_COOKIE}=${createHandoff().value}`}}),res,{central:async()=>{exchanges++;}});assert.equal(res.code,401);assert.equal(exchanges,0); }finally{restore();}
});
test("workspace endpoints recheck access, bind UID and reject cross-account or stale writes",async()=>{
 enable();try {
  const patch={projects:[],scripts:[],settings:{},apid:null,asid:null,view:"full"};
  assert.throws(()=>workspacePatch({...patch,uid:"another-user"}));assert.throws(()=>workspacePatch({...patch,scripts:"invalid"}));
  assert.throws(()=>workspacePatch({...patch,reportSummary:{version:1,projects:999,scripts:999}}));
  assert.throws(()=>workspacePatch({...patch,reportUpdatedAt:"forged"}));
  let valid=true;const db=new TransactionDatabase();db.seed("existing-owner",{scripts:[],projects:[]});
  const revision="1:0",time={seconds:1,nanoseconds:0};
  const deps={verify:async()=>valid?{uid:"existing-owner",data:{scripts:[]},revision,updateTime:time}:null,database:()=>db};
  let res=response();await handleStaff(request("workspace","POST",{body:patch}),res,deps);assert.equal(res.code,409);assert.equal(db.writes,0);
  res=response();await handleStaff(request("workspace","POST",{body:patch,headers:{origin:"https://scriptai.space","content-type":"application/json","x-workspace-revision":revision}}),res,deps);assert.equal(res.code,200);assert.equal(res.body.revision,"2:0");assert.equal(db.writes,1);
  assert.deepEqual(db.documents.get("users/existing-owner").reportSummary,{version:1,projects:0,scripts:0});
  valid=false;res=response();await handleStaff(request("workspace","GET"),res,deps);assert.equal(res.code,401);
  res=response();await handleStaff(request("workspace","POST",{headers:{origin:"https://attacker.example"},body:patch}),res,deps);assert.equal(res.code,403);assert.equal(db.writes,1);
 }finally{restore();}
});
test("logout does not claim success or clear the cookie when central revocation fails",async()=>{
 enable();try{const res=response();await handleStaff(request("logout","POST"),res,{revoke:async()=>{throw new Error("offline");}});assert.equal(res.code,503);assert.equal(res.headers["Set-Cookie"],undefined);}finally{restore();}
});

test("callback exchanges a browser-bound verifier and sets only secure server cookies",async()=>{
 enable();try {
  const flow=createHandoff(),token=opaque(),res=response();
  await handleStaff(request("callback","GET",{query:{action:"callback",state:flow.state,code:opaque()},headers:{cookie:`${HANDOFF_COOKIE}=${flow.value}`}}),res,{central:async(path,options)=>{
   assert.equal(path,"exchange");assert.equal(JSON.parse(options.body).verifier,readHandoff(flow.value,flow.state).verifier);
   return Response.json({token,expiresAt:new Date(Date.now()+600000).toISOString()});
  }});
  assert.equal(res.code,303);assert.equal(res.url,"/scriptai.html?staff=1");
  assert.ok(res.headers["Set-Cookie"][0].startsWith(`${STAFF_COOKIE}=${token};`));
  for(const property of ["HttpOnly","Secure","SameSite=Lax","Path=/"])assert.ok(res.headers["Set-Cookie"][0].includes(property));
  assert.ok(res.headers["Set-Cookie"][1].includes("Max-Age=0"));
 }finally{restore();}
});
test("a concurrent Firestore update preserves the draft and returns a conflict",async()=>{
 enable();try {
  const res=response(),patch={projects:[],scripts:[],settings:{},apid:null,asid:null,view:"full"};
  await handleStaff(request("workspace","POST",{body:patch,headers:{origin:"https://scriptai.space","content-type":"application/json","x-workspace-revision":"1:2"}}),res,{
   verify:async()=>({uid:"existing-owner",revision:"1:2",updateTime:{seconds:1,nanoseconds:2}}),
   database:()=>({collection:()=>({doc:()=>({})}),runTransaction:async()=>{throw Object.assign(new Error("changed"),{code:9});}})
  });assert.equal(res.code,409);
 }finally{restore();}
});

test("generation rechecks staff access and never falls back from an invalid customer header",async()=>{
 let checks=0;const req=request("generate","POST",{headers:{origin:"https://scriptai.space","content-type":"application/json",cookie:`${STAFF_COOKIE}=${opaque()}`}});
 const deps={verifyStaff:async()=>{checks++;return {uid:"existing-owner"};}};
 let res=response();assert.deepEqual(await authorizeAiRequest(req,res,deps),{uid:"existing-owner"});assert.equal(checks,1);
 res=response();assert.equal(await authorizeAiRequest({...req,headers:{...req.headers,authorization:"invalid"}},res,deps),null);assert.equal(res.code,401);assert.equal(checks,1);
 res=response();assert.equal(await authorizeAiRequest(req,res,{verifyStaff:async()=>null}),null);assert.equal(res.code,401);
 res=response();assert.equal(await authorizeAiRequest(req,res,{verifyStaff:async()=>{throw new Error("offline");}}),null);assert.equal(res.code,503);
});

test("legacy staff workspace writes cannot retarget a retained script relationship",async()=>{
 enable();try {
  const {TransactionDatabase}=await import('./helpers/transaction-database.mjs');
  const db=new TransactionDatabase();
  const patch={projects:[],scripts:[{id:'demo',blocks:[],novasFlow:{contentId:'original'}}],settings:{},apid:null,asid:null,view:'full'};
  db.seed('existing-owner',patch);
  const revision='1:0',res=response();
  const body=structuredClone(patch);body.scripts[0].novasFlow.contentId='retargeted';
  await handleStaff(request('workspace','POST',{body,headers:{origin:'https://scriptai.space','content-type':'application/json','x-workspace-revision':revision}}),res,{verify:async()=>({uid:'existing-owner',revision,updateTime:{seconds:1,nanoseconds:0}}),database:()=>db});
  assert.equal(res.code,409);assert.equal(db.writes,0);
  assert.deepEqual(db.documents.get('users/existing-owner'),patch);
 }finally{restore();}
});
test("staff acknowledgement never attaches a newer revision to the older submitted body",async()=>{
 enable();try {
  const {TransactionDatabase}=await import('./helpers/transaction-database.mjs');const db=new TransactionDatabase();
  const patch={projects:[],scripts:[{id:'demo',name:'v1',blocks:[]}],settings:{},apid:null,asid:null,view:'full'};db.seed('existing-owner',patch);
  const doc=db.doc.bind(db);db.doc=path=>({...doc(path),get:async()=>{const data=db.documents.get(path);if(path==='users/existing-owner'&&db.writes){data.scripts[0].name='Intervening newer edit';data.scripts[0].recordVersion=3;data.scriptWriteVersion++;db.version++;}return db.snapshot(path);}});
  const body=structuredClone(patch);body.scripts[0].name='Submitted v2';const res=response();
  await handleStaff(request('workspace','POST',{body,headers:{origin:'https://scriptai.space','content-type':'application/json','x-workspace-revision':'1:0'}}),res,{verify:async()=>({uid:'existing-owner',revision:'1:0',updateTime:{seconds:1,nanoseconds:0}}),database:()=>db});
  assert.equal(res.code,409);assert.equal(res.body.revision,undefined);assert.equal(db.documents.get('users/existing-owner').scripts[0].name,'Intervening newer edit');
 }finally{restore();}
});
