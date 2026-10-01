import { FieldValue } from "firebase-admin/firestore";
import { fingerprint, revisionKey, versionOf, retainRevisions, conflict } from './script-revisions.js';
import { AutomationError } from './automation-errors.js';
import { workspaceReportSummary } from '../assets/js/workspace-report-summary.js';

// Current workspace, immutable snapshots and retry receipt share one Firestore transaction.
export async function commitWorkspace(database, ownerId, updater, options={}) {
  const ref=database.collection('users').doc(ownerId);
  const receipt=options.operationId ? ref.collection('scriptWriteReceipts').doc(fingerprint(options.operationId)) : null;
  return database.runTransaction(async tx=>{
    const snapshot=await tx.get(ref);
    const before=snapshot.exists ? snapshot.data() : {projects:[],scripts:[]};
    if(receipt) {
      const prior=await tx.get(receipt);
      if(prior.exists) {
        if(prior.data().requestHash!==options.requestHash || prior.data().result.workspaceVersion !== (before.scriptWriteVersion||0)) conflict();
        return {...prior.data().result,replayed:true};
      }
    }
    if(options.expectedWorkspaceVersion!==undefined && options.expectedWorkspaceVersion!==(before.scriptWriteVersion||0)) conflict();
    if(options.expectedUpdateTime && `${snapshot.updateTime?.seconds}:${snapshot.updateTime?.nanoseconds}`!==options.expectedUpdateTime) conflict();
    const output=await updater({...before, scripts: structuredClone(before.scripts || []), projects: structuredClone(before.projects || [])}, async (id,version)=>{
      const found=await tx.get(ref.collection('scriptRevisions').doc(revisionKey(id,version)));
      return found.exists?found.data():null;
    });
    const retained=[];
    for(const script of before.scripts||[]) {
      const found=await tx.get(ref.collection('scriptRevisions').doc(revisionKey(script.id,versionOf(script))));
      if(found.exists) retained.push(found.data());
    }
    const transition=retainRevisions(before,output.workspace,retained,undefined,output.forceRevisionIds);
    if(transition.revisions.length>400) throw new AutomationError('INVALID_REQUEST','Too many changed scripts in one save.',422);
    const changed=fingerprint(before)!==fingerprint(transition.workspace);
    const workspace=changed?{...transition.workspace,scriptWriteVersion:(before.scriptWriteVersion||0)+1}:before;
    // Every changed save, including automation, refreshes counts in the same transaction.
    if(changed) workspace.reportSummary=workspaceReportSummary(workspace);
    if(changed && output.updatedAt) workspace.automationUpdatedAt=output.updatedAt;
    const result={...output,workspace};
    const scriptId=output.result?.scriptId || output.result?.id;
    if(scriptId) result.result={...output.result,recordVersion:workspace.scripts.find(s=>s.id===scriptId)?.recordVersion};
    for(const revision of transition.revisions) tx.create(ref.collection('scriptRevisions').doc(revisionKey(revision.scriptId,revision.version)),revision);
    if(changed) tx.set(ref,{...workspace,reportUpdatedAt:FieldValue.serverTimestamp()});
    // Receipts contain only the returned IDs/versions, not another editable script copy.
    const publicResult={result:result.result||null,workspaceVersion:workspace.scriptWriteVersion||0,scriptVersions:Object.fromEntries((workspace.scripts||[]).map(s=>[s.id,s.recordVersion||1]))};
    if(receipt) tx.create(receipt,{requestHash:options.requestHash,result:publicResult});
    return {...result,...publicResult};
  });
}

export async function readHistory(database,ownerId,scriptId) {
  const ref=database.collection('users').doc(ownerId);
  const current=await ref.get();
  const script=current.data()?.scripts?.find(s=>s.id===scriptId);
  if(!script) throw new AutomationError('RECORD_NOT_FOUND','Script not found.',404);
  const history=await ref.collection('scriptRevisions').where('scriptId','==',scriptId).get();
  return {scriptId,currentVersion:versionOf(script),revisions:history.docs.map(d=>d.data()).sort((a,b)=>b.version-a.version)};
}
