import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const enabled = process.env.RUN_REVISION_RULES === '1';
test('client rules protect script bodies, history, counters and queued old writes', { skip: !enabled }, async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!/^127\.0\.0\.1:\d+$/.test(host || '') || process.env.FIREBASE_PROJECT_ID !== 'demo-script-rules') throw new Error('Disposable local demo emulator required');
  const { initializeTestEnvironment, assertSucceeds, assertFails } = await import('@firebase/rules-unit-testing');
  const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, disableNetwork, enableNetwork, serverTimestamp } = await import('firebase/firestore');
  const [hostname, port] = host.split(':');
  // Optional local baseline file enables a red run against the read-only deployed snapshot.
  const rules = await readFile(process.env.REVISION_RULES_FILE || new URL('../firestore.rules', import.meta.url), 'utf8');
  const env = await initializeTestEnvironment({ projectId: process.env.FIREBASE_PROJECT_ID, firestore: { host: hostname, port: Number(port), rules } });
  try {
    await env.clearFirestore();
    const owner = env.authenticatedContext('owner').firestore();
    const other = env.authenticatedContext('other').firestore();
    const anon = env.unauthenticatedContext().firestore();
    const initial = { email:'test@example.invalid', displayName:'Disposable', projects:[], scripts:[], view:'full', settings:{}, createdAt:'test', reportSummary:{}, reportUpdatedAt:serverTimestamp() };
    await assertSucceeds(setDoc(doc(owner,'users/owner'),initial));
    await assertFails(setDoc(doc(other,'users/forged'),initial));
    await assertFails(setDoc(doc(anon,'users/anon'),initial));
    await assertFails(setDoc(doc(owner,'users/owner/scripts/fake'),{blocks:[]}));
    await assertFails(setDoc(doc(owner,'users/owner/scriptRevisions/forged'),{scriptId:'s1',version:1}));
    await assertFails(setDoc(doc(owner,'users/owner/scriptWriteReceipts/forged'),{result:{}}));
    await assertFails(updateDoc(doc(owner,'users/owner'),{scripts:[{id:'new'}]}));
    await assertFails(updateDoc(doc(owner,'users/owner'),{scriptWriteVersion:1}));
    await assertFails(updateDoc(doc(owner,'users/owner'),{role:'admin'}));
    await assertFails(deleteDoc(doc(owner,'users/owner')));
    const script = {id:'s1',recordVersion:2,blocks:[{id:'b1',text:'Current',type:'speech'}],novasFlow:{contentId:'c1'}};
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db,'users/owner'),{scripts:[script],scriptWriteVersion:2});
      await setDoc(doc(db,'users/owner/scriptRevisions/s1-1'),{scriptId:'s1',version:1,script:{...script,recordVersion:1}});
      await setDoc(doc(db,'users/owner/scriptWriteReceipts/op'),{workspaceVersion:2});
    });
    await assertSucceeds(getDoc(doc(owner,'users/owner')));
    await assertSucceeds(getDocs(collection(owner,'users/owner/scriptRevisions')));
    for (const db of [other,anon]) {
      await assertFails(getDoc(doc(db,'users/owner')));
      await assertFails(getDoc(doc(db,'users/owner/scriptRevisions/s1-1')));
      await assertFails(getDocs(collection(db,'users/owner/scriptRevisions')));
      await assertFails(updateDoc(doc(db,'users/owner'),{displayName:'intruder'}));
    }
    await assertFails(getDoc(doc(owner,'users/owner/scriptWriteReceipts/op')));
    await assertFails(updateDoc(doc(owner,'users/owner/scriptRevisions/s1-1'),{script:{}}));
    await assertFails(deleteDoc(doc(owner,'users/owner/scriptRevisions/s1-1')));
    await assertFails(updateDoc(doc(owner,'users/owner/scriptWriteReceipts/op'),{workspaceVersion:999}));
    await assertFails(deleteDoc(doc(owner,'users/owner/scriptWriteReceipts/op')));
    await assertFails(updateDoc(doc(owner,'users/owner'),{scripts:[{...script,blocks:[]}]}));
    await assertFails(updateDoc(doc(owner,'users/owner'),{scriptWriteVersion:1}));
    await assertFails(setDoc(doc(owner,'users/owner'),{displayName:'omit protected fields'}));
    await assertSucceeds(updateDoc(doc(owner,'users/owner'),{displayName:'Updated',settings:{theme:'dark'},projects:[{id:'p1'}],view:'calendar'}));
    const current=(await getDoc(doc(owner,'users/owner'))).data();
    await assertSucceeds(setDoc(doc(owner,'users/owner'),{...current,view:'full'}));
    await assertFails(setDoc(doc(owner,'users/owner'),{...current,scripts:[{...script,recordVersion:1,blocks:[]}]}));
    // An actual Firestore client offline queue retries after reconnect and is rejected by rules.
    await disableNetwork(owner);
    const pending = setDoc(doc(owner,'users/owner'),{...current,scripts:[{...script,blocks:[{text:'Queued stale overwrite'}]}]});
    const rejected = assertFails(pending);
    await enableNetwork(owner);
    await rejected;
    assert.deepEqual((await getDoc(doc(owner,'users/owner'))).data().scripts,[script]);
    assert.equal((await getDoc(doc(owner,'users/owner'))).data().scriptWriteVersion,2);
    assert.equal((await getDocs(collection(owner,'users/owner/scriptRevisions'))).size,1);
    await assertFails(setDoc(doc(env.authenticatedContext('new').firestore(),'users/new'),{...initial,scripts:[script]}));
  } finally { await env.cleanup(); }
});
