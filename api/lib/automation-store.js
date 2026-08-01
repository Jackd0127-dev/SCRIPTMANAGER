import { randomUUID } from "node:crypto";

import { AutomationError } from "./automation-errors.js";
import { scriptAiAdminFirestore } from "./firebase-admin.js";

const TOKEN_COLLECTION = "scriptAiAutomationTokens";
const AUDIT_COLLECTION = "scriptAiAutomationAudit";

export class FirestoreAutomationStore {
  async createToken(record) {
    await scriptAiAdminFirestore().collection(TOKEN_COLLECTION).doc(record.id).create(record);
  }

  async getToken(id) {
    const snapshot = await scriptAiAdminFirestore().collection(TOKEN_COLLECTION).doc(id).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  async updateToken(id, ownerId, update) {
    const reference = scriptAiAdminFirestore().collection(TOKEN_COLLECTION).doc(id);
    await scriptAiAdminFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const current = snapshot.data();
      if (!current || current.ownerId !== ownerId)
        throw new AutomationError("AUTH_REQUIRED", "Automation token not found.", 401);
      transaction.update(reference, update);
    });
  }

  async listTokens(ownerId) {
    const snapshot = await scriptAiAdminFirestore()
      .collection(TOKEN_COLLECTION)
      .where("ownerId", "==", ownerId)
      .limit(100)
      .get();
    return snapshot.docs.map((document) => document.data());
  }

  async recordAudit(ownerId, action, tokenId, at) {
    await scriptAiAdminFirestore().collection(AUDIT_COLLECTION).doc(randomUUID()).set({
      ownerId,
      action,
      tokenId,
      at,
    });
  }

  async getWorkspace(ownerId) {
    const snapshot = await scriptAiAdminFirestore().collection("users").doc(ownerId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  async updateWorkspace(ownerId, updater) {
    const reference = scriptAiAdminFirestore().collection("users").doc(ownerId);
    let result;
    await scriptAiAdminFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const workspace = snapshot.exists ? snapshot.data() : { projects: [], scripts: [] };
      result = updater(workspace);
      transaction.set(
        reference,
        {
          projects: result.workspace.projects,
          scripts: result.workspace.scripts,
          automationUpdatedAt: result.updatedAt,
        },
        { merge: true },
      );
    });
    return result;
  }
}

const memoryState = globalThis.__scriptAiAutomationMemory || {
  tokens: new Map(),
  workspaces: new Map(),
  audit: [],
};
globalThis.__scriptAiAutomationMemory = memoryState;

export class MemoryAutomationStore {
  async createToken(record) {
    if (memoryState.tokens.has(record.id)) throw new Error("Token exists");
    memoryState.tokens.set(record.id, structuredClone(record));
  }
  async getToken(id) {
    return structuredClone(memoryState.tokens.get(id) || null);
  }
  async updateToken(id, ownerId, update) {
    const current = memoryState.tokens.get(id);
    if (!current || current.ownerId !== ownerId)
      throw new AutomationError("AUTH_REQUIRED", "Automation token not found.", 401);
    memoryState.tokens.set(id, { ...current, ...structuredClone(update) });
  }
  async listTokens(ownerId) {
    return [...memoryState.tokens.values()]
      .filter((token) => token.ownerId === ownerId)
      .map((token) => structuredClone(token));
  }
  async recordAudit(ownerId, action, tokenId, at) {
    memoryState.audit.push({ ownerId, action, tokenId, at });
  }
  async getWorkspace(ownerId) {
    return structuredClone(memoryState.workspaces.get(ownerId) || null);
  }
  async updateWorkspace(ownerId, updater) {
    const current = structuredClone(
      memoryState.workspaces.get(ownerId) || { projects: [], scripts: [] },
    );
    const result = updater(current);
    memoryState.workspaces.set(ownerId, structuredClone(result.workspace));
    return structuredClone(result);
  }
}

export function resetMemoryAutomationStore() {
  memoryState.tokens.clear();
  memoryState.workspaces.clear();
  memoryState.audit.length = 0;
}

let cachedStore;
export function automationStore() {
  if (cachedStore) return cachedStore;
  const backend = process.env.SCRIPTAI_AUTOMATION_BACKEND || "firestore";
  if (backend === "memory" && process.env.NODE_ENV === "production")
    throw new Error("The ScriptAI memory automation backend is forbidden in production.");
  cachedStore =
    backend === "memory"
      ? new MemoryAutomationStore()
      : new FirestoreAutomationStore();
  return cachedStore;
}
