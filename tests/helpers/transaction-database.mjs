// Disposable Firestore transaction contract double. No network, credentials or production data.
export class TransactionDatabase {
 constructor(){this.documents=new Map();this.version=1;this.failNext=false;this.beforeCommit=null;this.writes=0;}
 collection(path){return this.collectionRef(path);}
 collectionRef(path){return {doc:id=>this.doc(`${path}/${id}`),where:(field,op,value)=>({get:async()=>({docs:[...this.documents].filter(([key,data])=>key.startsWith(path+'/')&&key.slice(path.length+1).indexOf('/')<0&&data[field]===value).map(([key,data])=>this.snapshot(key))})})};}
 doc(path){return {path,collection:name=>this.collectionRef(`${path}/${name}`),get:async()=>this.snapshot(path)};}
 snapshot(path){const data=this.documents.get(path);return {exists:data!==undefined,data:()=>structuredClone(data),updateTime:{seconds:this.version,nanoseconds:0}};}
 seed(owner,data){this.documents.set(`users/${owner}`,structuredClone(data));}
 async runTransaction(fn){
  for(let attempt=0;attempt<3;attempt++){
   const version=this.version, staged=[];
   const tx={get:async ref=>this.snapshot(ref.path),create:(ref,data)=>staged.push(['create',ref.path,structuredClone(data)]),set:(ref,data)=>staged.push(['set',ref.path,structuredClone(data)])};
   const result=await fn(tx);
   if(this.beforeCommit){const hook=this.beforeCommit;this.beforeCommit=null;await hook(this);}
   if(version!==this.version)continue;
   if(this.failNext){this.failNext=false;throw new Error('Injected write failure');}
   const next=new Map(this.documents);
   for(const [kind,path,data]of staged){if(kind==='create'&&next.has(path))throw new Error('Immutable revision exists');next.set(path,data);}
   this.documents=next;if(staged.length){this.version++;this.writes+=staged.length;}return result;
  }
  throw new Error('Transaction contention');
 }
}
