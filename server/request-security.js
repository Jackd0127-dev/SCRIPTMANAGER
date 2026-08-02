// Shared server code lives outside /api so Vercel does not deploy it as a route.
const FIREBASE_API_KEY =
  process.env.FIREBASE_WEB_API_KEY ||
  "AIzaSyCaq7I65QuHhhrK3QfoaR5dbJ_M98kA6U4";

const CONFIGURED_ALLOWED_ORIGINS = String(
  process.env.SCRIPTAI_TRUSTED_ORIGINS || "",
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const EXACT_ALLOWED_ORIGINS = new Set([
  "https://scriptai.space",
  "https://www.scriptai.space",
  "https://scriptmanager.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...CONFIGURED_ALLOWED_ORIGINS,
]);

export function isAllowedOrigin(origin) {
  if (typeof origin !== "string" || !origin) return false;
  return EXACT_ALLOWED_ORIGINS.has(origin);
}

export function isAllowedBrowserRequest(req) {
  if (isAllowedOrigin(req.headers?.origin)) return true;
  if (req.method !== "GET") return false;
  if (req.headers?.["sec-fetch-site"] !== "same-origin") return false;
  try {
    const referer = new URL(String(req.headers?.referer || ""));
    const forwardedHost = String(
      req.headers?.["x-forwarded-host"] || req.headers?.host || "",
    )
      .split(",")[0]
      .trim();
    const forwardedProto = String(req.headers?.["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim();
    return (
      isAllowedOrigin(referer.origin) &&
      referer.host === forwardedHost &&
      (!forwardedProto || referer.protocol === `${forwardedProto}:`)
    );
  } catch {
    return false;
  }
}

function bearerToken(header) {
  if (typeof header !== "string") return "";
  const match = header.match(/^Bearer ([A-Za-z0-9._-]+)$/);
  return match?.[1] || "";
}

export async function authorizeAiRequest(req, res) {
  if (!isAllowedOrigin(req.headers?.origin)) {
    res.status(403).json({ error: "Request origin is not allowed." });
    return null;
  }
  if (!String(req.headers?.["content-type"] || "").includes("application/json")) {
    res.status(415).json({ error: "Use application/json." });
    return null;
  }
  const idToken = bearerToken(req.headers?.authorization);
  if (!idToken) {
    res.status(401).json({ error: "Sign in to use ScriptAI generation." });
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    const user = payload?.users?.[0];
    const providerIds = Array.isArray(user?.providerUserInfo)
      ? user.providerUserInfo.map((provider) => provider?.providerId)
      : [];
    const trustedProvider = providerIds.some(
      (providerId) => providerId && providerId !== "password",
    );
    if (
      !response.ok ||
      !user?.localId ||
      (user.emailVerified !== true && !trustedProvider)
    ) {
      res.status(401).json({ error: "Your ScriptAI session is not valid." });
      return null;
    }
    return { uid: user.localId };
  } catch {
    res.status(503).json({ error: "ScriptAI could not verify your session." });
    return null;
  }
}
