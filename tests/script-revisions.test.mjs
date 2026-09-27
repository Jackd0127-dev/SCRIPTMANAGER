import test from 'node:test';
import assert from 'node:assert/strict';
import { retainRevisions, restoreScript, revisionKey } from '../server/script-revisions.js';
const script = (text='one') => ({id:'script-a',name:'Non-public fixture',recordVersion:1,status:'draft',novasFlow:{origin:'https://content.novasagency.com',contentId:'content-a'},blocks:[{id:'block-a',type:'speech',text,done:false}],notes:'fixture'});
const workspace = () => ({scripts:[script(),{id:'other',name:'Untouched',blocks:[]}],settings:{theme:'dark'},projects:[{id:'p'}]});
test('v1 baseline, v2, reopen and restore v1 as v3 retain structured history and stable links',()=>{
 const first=workspace(), next=structuredClone(first);next.scripts[0].blocks[0].text='two';
 const saved=retainRevisions(first,next,[],'2026-09-27T00:00:00Z');
 assert.deepEqual(saved.revisions.map(r=>r.version),[1,2]);
 const reopened=JSON.parse(JSON.stringify(saved.workspace));
 const restored=restoreScript(reopened,saved.revisions[0],2);
 const final=retainRevisions(reopened,restored,saved.revisions,'2026-09-27T00:01:00Z');
 assert.equal(final.workspace.scripts[0].recordVersion,3);
 assert.equal(final.workspace.scripts[0].blocks[0].text,'one');
 assert.deepEqual(final.workspace.scripts[0].novasFlow,first.scripts[0].novasFlow);
 assert.deepEqual(final.workspace.scripts[1],first.scripts[1]);
 assert.deepEqual(final.workspace.settings,first.settings);
 assert.equal(saved.revisions.find(r=>r.version===2).script.blocks[0].text,'two');
 assert.equal(revisionKey('script-a',1),revisionKey('script-a',1));
});
test('restore requires current version, retains production fields and rejects missing/cross-script records',()=>{
 const w=workspace();w.scripts[0].recordVersion=4;w.scripts[0].status='recorded';w.scripts[0].blocks[0].done=true;
 const revision={scriptId:'script-a',version:1,script:script()};
 assert.throws(()=>restoreScript(w,revision,3),/changed/i);
 assert.throws(()=>restoreScript(w,revision,undefined),/changed/i);
 const restored=restoreScript(w,revision,4);
 assert.equal(restored.scripts[0].status,'recorded');assert.equal(restored.scripts[0].blocks[0].done,true);
 assert.throws(()=>restoreScript(w,{...revision,scriptId:'absent'},4),/not found/i);
});
test('no-op retries retain no duplicate logical revision; legacy baseline uses actual available version',()=>{
 const w=workspace();delete w.scripts[0].recordVersion;
 assert.equal(retainRevisions(w,structuredClone(w),[]).revisions.length,0);
 const n=structuredClone(w);n.scripts[0].notes='changed';
 const result=retainRevisions(w,n,[]);
 assert.deepEqual(result.revisions.map(r=>r.version),[1,2]);
 assert.equal(retainRevisions(result.workspace,result.workspace,result.revisions).revisions.length,0);
 assert.equal(w.scripts[0].notes,'fixture');
});
