import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { centralIdentityMode } from "./central-identity.js";
import { scriptAiAdminAuth, scriptAiAdminFirestore } from "./firebase-admin.js";
export const STAFF_COOKIE = "__Host-scriptai_staff";
export const HANDOFF_COOKIE = "__Host-scriptai_handoff";
const BASE = "https://access.novasagency.com/api/staff-auth/scriptai";
export const opaque = () => randomBytes(32).toString("base64url");
export const validOpaque = value => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
export const challenge = value => createHash("sha256").update(value).digest("base64url");
export const staffEnabled = () => process.env.SCRIPTAI_STAFF_LOGIN_ENABLED === "true" && centralIdentityMode() !== "off";
function secret() { const value = process.env.STAFF_SCRIPTAI_INTROSPECTION_SECRET; if (!value || value.length < 32) throw new Error("Staff configuration unavailable"); return value; }
export function cookie(req, name) { return String(req.headers?.cookie || "").split(/;\s*/).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1); }
export const setCookie = (name, value, seconds) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(seconds))}`;
export function createHandoff() {
  const verifier = opaque(), state = opaque(), expires = Date.now() + 300000;
  const body = Buffer.from(JSON.stringify({ verifier, state, expires })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return { state, challenge: challenge(verifier), value: `${body}.${signature}` };
}
export function readHandoff(value, state) {
  if (typeof value !== "string" || value.length > 1024 || !validOpaque(state)) return null;
  const [body, signature, extra] = value.split("."); if (!body || !signature || extra) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const data = JSON.parse(Buffer.from(body, "base64url").toString()); return data.state === state && data.expires > Date.now() && validOpaque(data.verifier) ? data : null; } catch { return null; }
}
export async function centralRequest(path, options = {}) {
  return fetch(`${BASE}/${path}`, { ...options, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json", authorization: `Bearer ${secret()}`, "x-novas-audience": "https://api.scriptai.space", ...options.headers } });
}
export async function verifyStaffRequest(req, dependencies = {}) {
  if (!staffEnabled()) return null;
  const token = cookie(req, STAFF_COOKIE); if (!validOpaque(token)) return null;
  const response = await (dependencies.centralRequest || centralRequest)("session", { method: "POST", headers: { "x-staff-product-session": token } });
  if (!response.ok) return null;
  const grant = await response.json();
  if (grant.app !== "scriptai" || grant.audience !== "https://api.scriptai.space" || !["creator", "admin"].includes(grant.role) || typeof grant.legacyUserId !== "string" || !grant.legacyUserId || grant.legacyUserId.includes("/") || !Number.isInteger(grant.identityVersion) || !Number.isInteger(grant.entitlementVersion)) return null;
  const user = await (dependencies.auth || scriptAiAdminAuth()).getUser(grant.legacyUserId);
  if (user.disabled || !user.emailVerified || user.tenantId) return null;
  const document = await (dependencies.database || scriptAiAdminFirestore()).collection("users").doc(grant.legacyUserId).get();
  if (!document.exists) return null;
  return { uid: grant.legacyUserId, email: user.email || "", displayName: user.displayName || "", data: document.data(), updateTime: document.updateTime, revision: document.updateTime ? `${document.updateTime.seconds}:${document.updateTime.nanoseconds}` : null };
}
export async function revokeStaff(req) {
  const token = cookie(req, STAFF_COOKIE); if (!validOpaque(token)) return;
  const response = await centralRequest("session", { method: "DELETE", headers: { "x-staff-product-session": token } });
  if (response.ok) return;
  if (response.status === 401 && (await response.json()).error === "Staff session required") return;
  throw new Error("Central sign-out unavailable");
}
