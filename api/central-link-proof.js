import { centralIdentityConfiguration, centralIdentityMode, createLegacyLinkProof } from "../server/central-identity.js";
import { scriptAiAdminAuth } from "../server/firebase-admin.js";
import { isAllowedOrigin } from "../server/request-security.js";

function bearerToken(header) {
  return typeof header === "string" ? header.match(/^Bearer ([A-Za-z0-9._-]+)$/)?.[1] || "" : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (centralIdentityMode() === "off") return res.status(404).json({ error: "Central identity linking is disabled" });
  if (!isAllowedOrigin(req.headers?.origin)) return res.status(403).json({ error: "Request origin is not allowed" });
  const token = bearerToken(req.headers?.authorization);
  if (!token) return res.status(401).json({ error: "A recent ScriptAI sign-in is required" });

  try {
    const identity = await scriptAiAdminAuth().verifyIdToken(token, true);
    const now = Math.floor(Date.now() / 1000);
    if (!identity.auth_time || now - identity.auth_time > 15 * 60) return res.status(401).json({ error: "Sign in again before linking" });
    const configuration = centralIdentityConfiguration();
    return res.status(200).json({ appKey: "scriptai", proof: createLegacyLinkProof({ legacyUserId: identity.uid, ...configuration }), expiresIn: 300 });
  } catch {
    return res.status(401).json({ error: "The ScriptAI session or linking configuration is unavailable" });
  }
}
