import { createHash } from "node:crypto";
import { isAllowedOrigin } from "./request-security.js";

const WINDOW_MS = 15 * 60 * 1000;

/** Reserve durable account, mailbox, IP and daily budgets before generating a code. */
export async function reserveVerificationAllowance(db, { uid, email, ip, now = Date.now() }) {
  const dimensions = [
    { name: "uid", value: uid, limit: 5, windowMs: WINDOW_MS },
    { name: "email", value: email, limit: 5, windowMs: WINDOW_MS },
    { name: "ip", value: ip, limit: 8, windowMs: WINDOW_MS },
    { name: "global", value: "verification", limit: 1000, windowMs: 24 * 60 * 60 * 1000 },
  ].map((dimension) => {
    const window = Math.floor(now / dimension.windowMs);
    const digest = createHash("sha256").update(`${dimension.name}:${dimension.value}:${window}`).digest("hex");
    return { ...dimension, window, ref: db.collection("auth_email_rate_limits").doc(digest) };
  });
  return db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all(dimensions.map(({ ref }) => transaction.get(ref)));
    const counts = snapshots.map((snapshot) => {
      const used = snapshot.data()?.used;
      return Number.isSafeInteger(used) && used >= 0 ? used : 0;
    });
    const blocked = dimensions.filter((dimension, index) => counts[index] >= dimension.limit);
    if (blocked.length) return { allowed: false, retryAfterSeconds: Math.max(...blocked.map((dimension) => Math.max(1, Math.ceil(((dimension.window + 1) * dimension.windowMs - now) / 1000)))) };
    dimensions.forEach((dimension, index) => transaction.set(dimension.ref, {
      used: counts[index] + 1,
      dimension: dimension.name,
      expiresAt: new Date((dimension.window + 2) * dimension.windowMs),
      updatedAt: new Date(now),
    }));
    return { allowed: true, retryAfterSeconds: 1 };
  });
}

export async function deliverVerificationTemplate({ apiKey, email, actionUrl, fetcher = fetch }) {
  const url = new URL(actionUrl);
  if (url.protocol !== "https:" || url.searchParams.get("mode") !== "verifyEmail" || !url.searchParams.get("oobCode")) throw new Error("Invalid provider action.");
  const safeUrl = actionUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#039;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  if (safeUrl.length > 2000) throw new Error("Provider action exceeds the template limit.");
  const id = createHash("sha256").update(`scriptai-verification:${email}:${actionUrl}`).digest("hex");
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `scriptai-verification:${id}` },
    body: JSON.stringify({ to: [email], template: { id: "scriptai-email-verification", variables: { ACTION_URL: safeUrl } }, tags: [{ name: "app", value: "scriptai" }, { name: "event", value: "email-verification" }] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Email provider rejected the request.");
}

export function createVerificationEmailHandler({ getAuth, getDb, getApiKey, send = deliverVerificationTemplate }) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Use POST." }); }
    if (!isAllowedOrigin(req.headers?.origin)) return res.status(403).json({ error: "Request origin is not allowed." });
    if (!String(req.headers?.["content-type"] || "").includes("application/json")) return res.status(415).json({ error: "Use application/json." });
    const length = req.headers?.["content-length"];
    if (length !== undefined && (!Number.isSafeInteger(Number(length)) || Number(length) < 0 || Number(length) > 1024)) return res.status(413).json({ error: "Request is too large." });
    let body;
    try {
      if (typeof req.body === "string" && Buffer.byteLength(req.body) > 1024) return res.status(413).json({ error: "Request is too large." });
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (Buffer.byteLength(JSON.stringify(body ?? null)) > 1024) return res.status(413).json({ error: "Request is too large." });
    } catch { return res.status(400).json({ error: "Invalid request." }); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || body.action !== "verify-email") return res.status(400).json({ error: "Invalid request." });
    const bearer = typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
    const token = bearer.match(/^Bearer ([A-Za-z0-9._-]{100,8192})$/)?.[1];
    if (!token) return res.status(401).json({ error: "Sign in to request verification." });
    const apiKey = getApiKey();
    if (!apiKey) return res.status(503).json({ error: "Email delivery is not configured." });
    let auth, user;
    try {
      auth = getAuth();
      const decoded = await auth.verifyIdToken(token, true);
      // This app uses the project's primary identity namespace only.
      if (decoded.firebase?.tenant) throw new Error("Unsupported identity tenant.");
      user = await auth.getUser(decoded.uid);
      if (!user.uid || user.uid !== decoded.uid || user.disabled) throw new Error("Unavailable account.");
    } catch { return res.status(401).json({ error: "Your session is not valid." }); }
    const email = user.email?.trim().toLowerCase();
    if (!email || user.emailVerified) return res.status(400).json({ error: "Verification is not available for this account." });
    try {
      const ip = String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown").split(",")[0].trim();
      const allowance = await reserveVerificationAllowance(getDb(), { uid: user.uid, email, ip });
      if (!allowance.allowed) { res.setHeader("Retry-After", String(allowance.retryAfterSeconds)); return res.status(429).json({ error: "Wait before requesting another verification email." }); }
      // Preserve the existing Firebase-hosted handler and default continuation.
      const actionUrl = await auth.generateEmailVerificationLink(email);
      await send({ apiKey, email, actionUrl });
      return res.status(200).json({ ok: true });
    } catch { return res.status(502).json({ error: "Verification email could not be sent." }); }
  };
}
