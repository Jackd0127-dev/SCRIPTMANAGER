// Shared server code lives outside /api so Vercel does not deploy it as a route.
import { AutomationError, requireAutomationFeature } from "./automation-errors.js";
import { automationStore } from "./automation-store.js";
import {
  assertUsableToken,
  parseScriptAiToken,
} from "./automation-token.js";
import { scriptAiAdminAuth } from "./firebase-admin.js";
import { isAllowedBrowserRequest } from "./request-security.js";

function bearer(header) {
  return String(header || "").match(/^Bearer ([^\s]+)$/u)?.[1] || "";
}

function assertHttps(req) {
  const protocol = String(req.headers?.["x-forwarded-proto"] || "").split(",")[0];
  if (process.env.NODE_ENV === "production" && protocol !== "https")
    throw new AutomationError(
      "AUTH_REQUIRED",
      "ScriptAI integration tokens are accepted only over HTTPS.",
      401,
    );
}

export async function authorizeAutomationUserRequest(req) {
  requireAutomationFeature();
  if (!isAllowedBrowserRequest(req))
    throw new AutomationError(
      "INVALID_REQUEST_ORIGIN",
      "Request origin is not allowed.",
      403,
    );
  const idToken = bearer(req.headers?.authorization);
  if (!idToken)
    throw new AutomationError("AUTH_REQUIRED", "Sign in to manage ScriptAI tokens.", 401);
  try {
    const decoded = await scriptAiAdminAuth().verifyIdToken(idToken, true);
    const provider = decoded.firebase?.sign_in_provider;
    if (!decoded.uid || (provider === "password" && decoded.email_verified !== true))
      throw new Error("unverified");
    return { ownerId: decoded.uid };
  } catch {
    throw new AutomationError(
      "AUTH_REQUIRED",
      "The ScriptAI session is not valid.",
      401,
    );
  }
}

export async function authorizeIntegrationRequest(req, requiredScopes) {
  requireAutomationFeature();
  assertHttps(req);
  const rawToken = bearer(req.headers?.authorization);
  const parsed = parseScriptAiToken(rawToken);
  if (!parsed)
    throw new AutomationError(
      "AUTH_REQUIRED",
      "A valid ScriptAI integration token is required.",
      401,
    );
  const store = automationStore();
  const record = assertUsableToken(
    await store.getToken(`sai-pat-${parsed.tokenId}`),
    rawToken,
    requiredScopes,
  );
  await store.updateToken(record.id, record.ownerId, {
    lastUsedAt: new Date().toISOString(),
  });
  return { ownerId: record.ownerId, tokenId: record.id, store };
}
