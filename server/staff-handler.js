import { FieldValue } from "firebase-admin/firestore";
import { scriptAiAdminFirestore } from "./firebase-admin.js";
import { isAllowedBrowserRequest, isAllowedOrigin } from "./request-security.js";
import { STAFF_COOKIE, HANDOFF_COOKIE, staffEnabled, cookie, setCookie, createHandoff, readHandoff, validOpaque, centralRequest, verifyStaffRequest, revokeStaff } from "./staff-session.js";
const SAVE_FIELDS = new Set(["projects", "scripts", "settings", "apid", "asid", "view"]);
export function workspacePatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !SAVE_FIELDS.has(key)) || Buffer.byteLength(JSON.stringify(body)) > 900000 || !Array.isArray(body.projects) || !Array.isArray(body.scripts) || !body.settings || typeof body.settings !== "object" || Array.isArray(body.settings) || ![body.apid, body.asid].every(value => value === null || typeof value === "string") || typeof body.view !== "string") throw new Error("Invalid workspace");
  return { ...body, apid: body.apid ?? FieldValue.delete(), asid: body.asid ?? FieldValue.delete() };
}
export async function handleStaff(req, res, dependencies = {}) {
  const deps = { verify: verifyStaffRequest, central: centralRequest, revoke: revokeStaff, database: scriptAiAdminFirestore, ...dependencies };
  res.setHeader("Cache-Control", "private, no-store"); res.setHeader("Referrer-Policy", "no-referrer");
  const action = req.query?.action;
  try {
    if (!staffEnabled()) return res.status(404).json({ error: "Not found" });
    if (req.method === "GET" && action === "config") return res.status(200).json({ enabled: true });
    if (req.method === "GET" && action === "start") {
      const handoff = createHandoff(); res.setHeader("Set-Cookie", setCookie(HANDOFF_COOKIE, handoff.value, 300));
      const url = new URL("https://access.novasagency.com/api/staff-auth/scriptai/authorize"); url.searchParams.set("state", handoff.state); url.searchParams.set("challenge", handoff.challenge);
      return res.redirect(303, url.href);
    }
    if (req.method === "GET" && action === "callback") {
      const handoff = readHandoff(cookie(req, HANDOFF_COOKIE), req.query?.state);
      if (!handoff || !validOpaque(req.query?.code)) return res.status(401).json({ error: "Restart staff sign-in from ScriptAI." });
      const response = await deps.central("exchange", { method: "POST", body: JSON.stringify({ code: req.query.code, verifier: handoff.verifier }) });
      if (!response.ok) return res.status(401).json({ error: "Staff sign-in expired or unavailable. Restart from ScriptAI." });
      const result = await response.json(), seconds = (Date.parse(result.expiresAt) - Date.now()) / 1000;
      if (!validOpaque(result.token) || !Number.isFinite(seconds) || seconds <= 0 || seconds > 1800) throw new Error("Invalid session");
      res.setHeader("Set-Cookie", [setCookie(STAFF_COOKIE, result.token, seconds), setCookie(HANDOFF_COOKIE, "", 0)]);
      return res.redirect(303, "/scriptai.html?staff=1");
    }
    if (!isAllowedBrowserRequest(req)) return res.status(403).json({ error: "Invalid origin" });
    if (action === "logout" && req.method === "POST") {
      await deps.revoke(req); res.setHeader("Set-Cookie", setCookie(STAFF_COOKIE, "", 0)); return res.status(200).json({ signedOut: true });
    }
    if (!((action === "session" && req.method === "GET") || (action === "workspace" && ["GET", "POST"].includes(req.method)))) return res.status(405).json({ error: "Method not allowed" });
    const staff = await deps.verify(req); if (!staff) return res.status(401).json({ error: "Staff sign-in required" });
    if (action === "session") return res.status(200).json({ uid: staff.uid, email: staff.email, displayName: staff.displayName });
    if (req.method === "GET") return res.status(200).json({ data: staff.data, revision: staff.revision });
    if (!isAllowedOrigin(req.headers.origin) || !String(req.headers["content-type"]).includes("application/json")) return res.status(403).json({ error: "Invalid request" });
    let patch; try { patch = workspacePatch(req.body); } catch { return res.status(400).json({ error: "Invalid workspace" }); }
    // Existing UID is server-derived; caller cannot select another account or create one.
    if (!staff.updateTime || req.headers["x-workspace-revision"] !== staff.revision) return res.status(409).json({ error: "Workspace changed. Keep your draft and refresh before saving." });
    const result = await deps.database().collection("users").doc(staff.uid).update(patch, { lastUpdateTime: staff.updateTime });
    return res.status(200).json({ saved: true, revision: `${result.writeTime.seconds}:${result.writeTime.nanoseconds}` });
  } catch (error) {
    if (error?.code === 9 || error?.code === "failed-precondition") return res.status(409).json({ error: "Workspace changed. Keep your draft and refresh before saving." });
    return res.status(503).json({ error: "Staff service unavailable. Retry without changing accounts." });
  }
}
