import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../assets/js/director-auth.js',import.meta.url),'utf8');
function client(request){
 const timers=[],indicator={classList:{remove(){},add(){},toggle(){}},textContent:''};
 const window={S:{scripts:[{id:'a',blocks:[{text:'v1'}]}],settings:{autosave:true}},scriptHistoryRequest:request,hasUnsavedScriptChanges:false};
 const context=vm.createContext({window,crypto:{randomUUID:()=>crypto.randomUUID()},JSON,Promise,document:{getElementById:()=>indicator},localStorage:{setItem(){}},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){}});
 vm.runInContext('let saveInFlight=null,saveTimeout=null,editSequence=0,pendingSaveRequest=null,workspaceWriteVersion=0,currentUser={};const demoStateForSave=()=>JSON.parse(JSON.stringify(window.S));',context);
 vm.runInContext(source.slice(source.indexOf('window.saveNow ='),source.indexOf('// Proof is short-lived')),context);
 return {window,timers,indicator};
}
test('manual/autosave share serialized saves, preserve edits made during request and retry exact operation',async()=>{
 let finish,calls=[];const c=client(body=>{calls.push(structuredClone(body));return new Promise(resolve=>{finish=resolve;});});
 c.window.save();const a=c.window.saveNow(),b=c.window.saveNow();await Promise.resolve();assert.equal(calls.length,1);
 c.window.S.scripts[0].blocks[0].text='v2';c.window.save();finish({workspaceVersion:1,scriptVersions:{a:1}});await a;
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(c.window.hasUnsavedScriptChanges,true);assert.equal(c.window.S.scripts[0].blocks[0].text,'v2');
 const next=c.window.saveNow();await Promise.resolve();assert.equal(calls[1].expectedWorkspaceVersion,1);finish({workspaceVersion:2,scriptVersions:{a:2}});await Promise.all([next,b]);assert.equal(c.window.hasUnsavedScriptChanges,false);
 let fail=true;const ids=[];const retry=client(async body=>{ids.push(body.operationId);if(fail)throw Error('connection lost');return {workspaceVersion:1,scriptVersions:{a:1}};});
 assert.equal(await retry.window.saveNow(),false);fail=false;assert.equal(await retry.window.saveNow(),true);assert.equal(ids[0],ids[1]);
});
test('autosave off keeps the draft unsaved; repeated disposable demo saves do not stick in-flight',async()=>{
 const c=client(()=>{throw Error('must not run');});c.window.S.settings.autosave=false;c.window.save();assert.equal(c.timers.length,0);assert.equal(c.window.hasUnsavedScriptChanges,true);
 c.window.isDemoMode=true;assert.equal(await c.window.saveNow(),true);c.window.S.scripts[0].blocks[0].text='second';c.window.save();assert.equal(await c.window.saveNow(),true);
});
test('remote snapshots cannot replace a dirty draft or an open edit form and advance its stale baseline',()=>{
 let modal=false;
 const window={S:{},DEFAULT_SETTINGS:{}};
 const context=vm.createContext({window,document:{body:{classList:{contains:()=>modal}}},renderSidebarFallback(){}});
 vm.runInContext('let hydratedOwner=null,currentUser={uid:"owner"},pendingSaveRequest=null,saveInFlight=null,workspaceWriteVersion=0;',context);
 vm.runInContext(source.slice(source.indexOf('function hydrateWorkspaceData('),source.indexOf('function showScreen(')),context);
 const hydrate=data=>{context.data=data;vm.runInContext('hydrateWorkspaceData(data)',context);};
 hydrate({scripts:[{id:'a',name:'v1'}],projects:[],scriptWriteVersion:1});
 modal=true;hydrate({scripts:[{id:'a',name:'v2 remote'}],projects:[],scriptWriteVersion:2});
 assert.equal(window.S.scripts[0].name,'v1');assert.equal(vm.runInContext('workspaceWriteVersion',context),1);
 modal=false;window.hasUnsavedScriptChanges=true;hydrate({scripts:[],projects:[],scriptWriteVersion:3});assert.equal(window.S.scripts[0].name,'v1');
});
test('stale save retains the unsaved body and its original precondition on retry',async()=>{
 const calls=[];const c=client(async body=>{calls.push(structuredClone(body));throw new Error('Script changed. Keep your draft and review the newer version.');});
 let message;c.window.showToast=value=>{message=value;};
 c.window.S.scripts[0].blocks[0].text='Unsaved edit based on v1';c.window.save();
 assert.equal(await c.window.saveNow(),false);
 assert.equal(c.window.hasUnsavedScriptChanges,true);assert.match(message,/Keep your draft/);
 assert.equal(c.window.S.scripts[0].blocks[0].text,'Unsaved edit based on v1');
 assert.equal(await c.window.saveNow(),false);assert.equal(calls[0].expectedWorkspaceVersion,calls[1].expectedWorkspaceVersion);
 assert.equal(calls[0].operationId,calls[1].operationId);
});
test('explicit save during an in-flight save waits for its own new body to persist',async()=>{
 const calls=[],finishes=[];const c=client(body=>{calls.push(structuredClone(body));return new Promise(resolve=>finishes.push(resolve));});
 const first=c.window.saveNow();await Promise.resolve();
 c.window.S.scripts.push({id:'linked',blocks:[{text:'new linked draft'}]});
 let settled=false;const second=c.window.saveNow().then(value=>{settled=true;return value;});
 finishes[0]({workspaceVersion:1,scriptVersions:{a:1}});await first;
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(settled,false);assert.equal(calls.length,2);assert.equal(calls[1].workspace.scripts[1].id,'linked');
 finishes[1]({workspaceVersion:2,scriptVersions:{a:1,linked:1}});assert.equal(await second,true);assert.equal(c.window.hasUnsavedScriptChanges,false);
});
