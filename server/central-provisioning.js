import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { scriptAiAdminFirestore } from "./firebase-admin.js";

const ROLES = new Set(["creator", "admin"]);

export function verifyProvisioningSignature(body, headers, secret, now = Date.now()) {
  const timestamp = String(headers?.["x-novas-timestamp"] || "");
  const received = String(headers?.["x-novas-signature"] || "");
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Math.floor(now / 1000) - seconds) > 300) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function applyCentralProvisioning(command) {
  if (!command?.idempotencyKey || command?.entitlement?.appKey !== "scriptai" || !ROLES.has(command?.entitlement?.role) || !Number.isInteger(command?.entitlement?.revocationVersion)) throw new Error("Invalid ScriptAI provisioning command");
  const database = scriptAiAdminFirestore();
  const shadowUserId = command.identity.legacyUserId || `central-${command.identity.centralIdentityId}`;
  const jobId = createHash("sha256").update(command.idempotencyKey).digest("hex");
  const jobRef = database.collection("centralIdentityProvisioning").doc(jobId);
  const accountRef = database.collection("centralIdentityAccounts").doc(shadowUserId);
  return database.runTransaction(async (transaction) => {
    const [job, account] = await Promise.all([transaction.get(jobRef), transaction.get(accountRef)]);
    if (job.exists) return job.data()?.result;
    if (Number(account.data()?.revocationVersion ?? -1) > command.entitlement.revocationVersion) throw new Error("Stale ScriptAI provisioning command");
    const status = command.operation === "revoke" ? "locked" : "active";
    const result = { adapterKey: "scriptai", appKey: "scriptai", shadowUserId, status, appliedRole: command.entitlement.role, appliedRevocationVersion: command.entitlement.revocationVersion };
    transaction.set(accountRef, { centralIdentityId: command.identity.centralIdentityId, role: command.entitlement.role, status, revocationVersion: command.entitlement.revocationVersion, updatedAt: FieldValue.serverTimestamp(), ...(!account.exists ? { createdAt: FieldValue.serverTimestamp() } : {}) }, { merge: true });
    transaction.create(jobRef, { result, appliedAt: FieldValue.serverTimestamp() });
    return result;
  });
}
