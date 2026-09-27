// Local-only disposable UI harness: real UI and save code, fake identity, emulator data only.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { scriptAiAdminFirestore } from '../server/firebase-admin.js';
import { createHistoryHandler } from '../server/script-history-handler.js';
import { commitWorkspace } from '../server/revision-store.js';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8787'||process.env.FIREBASE_PROJECT_ID!=='demo-script-revisions')throw Error('Disposable emulator required');
const db=scriptAiAdminFirestore(),owner=`ui-fixture-${randomUUID()}`,root=process.cwd();
const initial={projects:[{id:'demo-project',name:'Local revision fixture',color:'#ffffff'}],scripts:[{id:'demo-script',projectId:'demo-project',name:'NON-PUBLIC revision demonstration',status:'draft',platforms:[],notes:'Disposable emulator only. v1.',blocks:[{id:'demo-block',type:'speech',spoken:'This is version one of the disposable script.',text:'',desc:'',done:false}],novasFlow:{origin:'https://content.novasagency.com',contentId:'disposable-content'}},{id:'untouched-script',projectId:'demo-project',name:'Untouched fixture',status:'draft',blocks:[]}],settings:{theme:'dark',autosave:true},asid:'demo-script',apid:'demo-project',view:'full'};
await db.collection('users').doc(owner).set({...initial,scripts:[]});
await commitWorkspace(db,owner,()=>({workspace:initial}));
const handler=createHistoryHandler({database:()=>db,authorize:async()=>({uid:owner})});
const authSource=await readFile('assets/js/director-auth.js','utf8');
const saveSource=authSource.slice(authSource.indexOf('window.saveNow ='),authSource.indexOf('// Proof is short-lived'));
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/script-history'){
   let text='';for await(const chunk of req)text+=chunk;
   req.body=JSON.parse(text);res.status=code=>{res.statusCode=code;return res;};res.json=body=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));return res;};await handler(req,res);return;
  }
  if(pathname==='/fixture-workspace'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify((await db.collection('users').doc(owner).get()).data()));return;}
  if(pathname==='/fixture-boot.js'){
   res.setHeader('Content-Type','text/javascript');res.end(`
let saveInFlight=null,saveTimeout=null,editSequence=0,pendingSaveRequest=null,workspaceWriteVersion=0,currentUser={uid:'disposable'};
window.hasUnsavedScriptChanges=false;
const demoStateForSave=()=>({projects:S.projects,scripts:S.scripts,settings:S.settings,apid:S.apid||null,asid:S.asid||null,view:S.view||'full'});
window.scriptHistoryRequest=async body=>{const r=await fetch('/api/script-history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error);return data;};
${saveSource}
fetch('/fixture-workspace').then(r=>r.json()).then(data=>{window.S={...data,settings:{...DEFAULT_SETTINGS,...data.settings}};workspaceWriteVersion=data.scriptWriteVersion||0;document.querySelectorAll('.screen').forEach(e=>e.classList.remove('active'));document.getElementById('loadingScreen').style.display='none';document.getElementById('appScreen').style.display='flex';document.getElementById('appScreen').classList.add('active');applySettings();renderSb();selScript('demo-script');});`);return;
  }
  if(pathname==='/_vercel/insights/script.js'){res.end('');return;}
  const file=resolve(root,pathname==='/'?'scriptai.html':pathname.slice(1));if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
  let bytes=await readFile(file);
  if(file.endsWith('scriptai.html'))bytes=Buffer.from(bytes.toString().replace('<script type="module" src="assets/js/director-auth.js"></script>','').replace('</body>','<script src="/fixture-boot.js"></script></body>'));
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.cjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(bytes);
 }catch{res.writeHead(500).end('Local fixture error');}
});
server.listen(3107,'127.0.0.1',()=>console.log('Disposable ScriptAI UI: http://127.0.0.1:3107'));
process.on('SIGINT',async()=>{server.close();await db.recursiveDelete(db.collection('users').doc(owner));await db.terminate();process.exit(0);});
