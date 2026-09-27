import { createHash } from 'node:crypto';
import { AutomationError } from './automation-errors.js';

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,stable(value[k])]));
  return value;
}
export const fingerprint = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export const revisionKey = (id, version) => `${fingerprint(id)}-${version}`;
export const versionOf = script => Number.isSafeInteger(script?.recordVersion) && script.recordVersion > 0 ? script.recordVersion : 1;
const body = script => { const {recordVersion,...rest}=script; return rest; };
export function conflict() { throw new AutomationError('REVISION_CONFLICT','Script or workspace changed. Keep your draft and reload before saving.',409); }

// Pure transition: snapshots are persisted atomically by the caller, never embedded in editable data.
export function retainRevisions(before, after, retained = [], at = new Date().toISOString(), forceRevisionIds = []) {
  const workspace = {...after, scripts: structuredClone(after.scripts || [])}, revisions=[];
  const previous=new Map((before.scripts||[]).map(s=>[s.id,s]));
  const known=new Map(retained.map(r=>[revisionKey(r.scriptId,r.version),r]));
  const append=(script,version,baseline=false)=>{
    const record={scriptId:script.id,version,script:structuredClone({...script,recordVersion:version}),recordedAt:at,baseline};
    const existing=known.get(revisionKey(script.id,version));
    if(existing && fingerprint(existing.script)!==fingerprint(record.script)) conflict();
    if(!existing) revisions.push(record);
  };
  const ids=new Set();
  for(const s of workspace.scripts||[]) {
    if(!s?.id || typeof s.id!=='string' || ids.has(s.id)) throw new AutomationError('INVALID_REQUEST','Script IDs must be unique.',422);
    ids.add(s.id);
    const old=previous.get(s.id);
    if(old && !forceRevisionIds.includes(s.id) && fingerprint(body(old))===fingerprint(body(s))) { if(old.recordVersion!==undefined)s.recordVersion=old.recordVersion;else delete s.recordVersion;continue; }
    if(old) append(old,versionOf(old),true);
    s.recordVersion=old ? versionOf(old)+1 : 1;
    append(s,s.recordVersion);
  }
  // Preserve the last available body before a supported deletion too.
  for(const old of previous.values()) if(!ids.has(old.id)) append(old,versionOf(old),true);
  return {workspace,revisions};
}

const CONTENT_FIELDS=['name','blocks','notes','masterSpokenText','firstSecondHook','payoff','callToActionOrNextMilestone','targetDurationSeconds','longerRuntimeReason'];
export function restoreScript(workspace, revision, expectedVersion) {
  const current=workspace.scripts?.find(s=>s.id===revision?.scriptId);
  if(!current || revision.script?.id!==current.id) throw new AutomationError('RECORD_NOT_FOUND','Script revision not found.',404);
  if(expectedVersion!==versionOf(current)) conflict();
  const restored=structuredClone(current);
  for(const key of CONTENT_FIELDS) {
    if(Object.hasOwn(revision.script,key)) restored[key]=structuredClone(revision.script[key]);
    else delete restored[key];
  }
  const progress=new Map((current.blocks||[]).map(b=>[b.id,b]));
  for(const block of restored.blocks||[]) {
    const now=progress.get(block.id);
    for(const key of ['done','completed','filmed']) {
      if(now && Object.hasOwn(now,key)) block[key]=now[key];
      else if(Object.hasOwn(block,key)) block[key]=false;
    }
  }
  // Links, identity, automation ownership and production state always come from current.
  return {...workspace,scripts:workspace.scripts.map(s=>s.id===current.id?restored:s)};
}

// Both browser persistence routes preserve the existing integration identity.
export function assertScriptRelationships(before, after) {
  const old=new Map((before.scripts||[]).map(s=>[s.id,s]));
  for(const script of after.scripts||[]) {
    const previous=old.get(script.id);
    if(previous) for(const key of ['origin','contentId']) {
      if(fingerprint(script.novasFlow?.[key]??null)!==fingerprint(previous.novasFlow?.[key]??null)) conflict();
    }
    if(previous) for(const key of ['scriptAutomationKey','automation']) {
      if(fingerprint(script[key]??null)!==fingerprint(previous[key]??null)) conflict();
    }
  }
}
