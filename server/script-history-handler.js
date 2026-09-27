import { z } from 'zod';
import { authorizeAiRequest } from './request-security.js';
import { scriptAiAdminAuth, scriptAiAdminFirestore } from './firebase-admin.js';
import { sendAutomationError, AutomationError } from './automation-errors.js';
import { commitWorkspace, readHistory } from './revision-store.js';
import { restoreScript, fingerprint, assertScriptRelationships } from './script-revisions.js';
import { workspaceReportSummary } from '../assets/js/workspace-report-summary.js';
const id=z.string().min(1).max(160);
const patch=z.object({projects:z.array(z.record(z.string(),z.unknown())),scripts:z.array(z.object({id,blocks:z.array(z.record(z.string(),z.unknown())).optional()}).passthrough()),settings:z.record(z.string(),z.unknown()),apid:z.string().nullable(),asid:z.string().nullable(),view:z.string()}).strict();
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('history'),scriptId:id}).strict(),
 z.object({action:z.literal('save'),operationId:id,expectedWorkspaceVersion:z.number().int().nonnegative(),workspace:patch}).strict(),
 z.object({action:z.literal('restore'),operationId:id,scriptId:id,version:z.number().int().positive(),expectedRecordVersion:z.number().int().positive()}).strict(),
]);
export function createHistoryHandler(dependencies={}) {
 // Use the existing Admin app for server verification. The web API key is
 // browser-restricted; shared request, staff and account checks remain in force.
 const authorize=dependencies.authorize||((req,res)=>authorizeAiRequest(req,res,{
  lookupAccount:async token=>{
   try {
    const auth=(dependencies.auth||scriptAiAdminAuth)();
    const decoded=await auth.verifyIdToken(token,true);
    const user=await auth.getUser(decoded.uid);
    return {ok:true,json:async()=>({users:[{localId:user.uid,emailVerified:user.emailVerified,providerUserInfo:user.providerData}]})};
   } catch(error) {
    if(['auth/argument-error','auth/id-token-expired','auth/id-token-revoked','auth/invalid-id-token','auth/user-disabled','auth/user-not-found'].includes(error?.code))return {ok:false,json:async()=>({})};
    throw error;
   }
  },
 })), database=dependencies.database||scriptAiAdminFirestore;
 return async (req,res)=>{
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try {
   const user=await authorize(req,res);if(!user)return;
   if(Buffer.byteLength(JSON.stringify(req.body ?? null))>900000)throw new AutomationError('INVALID_REQUEST','Workspace is too large.',422);
   const input=schema.parse(req.body), db=database();
   if(input.action==='history')return res.status(200).json(await readHistory(db,user.uid,input.scriptId));
   const options={operationId:input.operationId,requestHash:fingerprint(input)};
   if(input.action==='save')options.expectedWorkspaceVersion=input.expectedWorkspaceVersion;
   const result=await commitWorkspace(db,user.uid,async (current,readRevision)=>{
    if(input.action==='restore') {
     const revision=await readRevision(input.scriptId,input.version);
     if(!revision)throw new AutomationError('RECORD_NOT_FOUND','Revision not found.',404);
     return {workspace:restoreScript(current,revision,input.expectedRecordVersion),forceRevisionIds:[input.scriptId],result:{id:input.scriptId}};
    }
    assertScriptRelationships(current,input.workspace);
    const workspace={...current,...input.workspace};
    workspace.reportSummary=workspaceReportSummary(workspace);
    return {workspace,updateReport:true};
   },options);
   return res.status(200).json({saved:true,workspaceVersion:result.workspaceVersion,scriptVersions:result.scriptVersions,result:result.result,replayed:result.replayed||false});
  }catch(error){return sendAutomationError(res,error);}
 };
}
