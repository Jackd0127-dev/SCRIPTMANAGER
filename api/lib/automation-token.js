import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { AutomationError } from "./automation-errors.js";

export const SCRIPT_AI_AUTOMATION_SCOPES = [
  "scripts:read",
  "scripts:write",
  "content-links:write",
];

const tokenPattern = /^sai_pat_([A-Za-z0-9_-]{16})_([A-Za-z0-9_-]{43})$/u;

export function tokenDigest(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createScriptAiTokenValue() {
  const tokenId = randomBytes(12).toString("base64url");
  return {
    tokenId,
    rawToken: `sai_pat_${tokenId}_${randomBytes(32).toString("base64url")}`,
  };
}

export function parseScriptAiToken(value) {
  const match = String(value || "").match(tokenPattern);
  return match?.[1] ? { tokenId: match[1], rawToken: value } : null;
}

export function tokenHashMatches(stored, candidate) {
  const left = Buffer.from(stored, "hex");
  const right = Buffer.from(tokenDigest(candidate), "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function assertUsableToken(record, rawToken, requiredScopes, now = new Date()) {
  if (!record || !tokenHashMatches(record.tokenHash, rawToken)) {
    throw new AutomationError(
      "AUTH_REQUIRED",
      "The ScriptAI integration token is invalid.",
      401,
    );
  }
  if (record.revokedAt) {
    throw new AutomationError(
      "AUTH_REQUIRED",
      "The ScriptAI integration token has been revoked.",
      401,
    );
  }
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= now.getTime()) {
    throw new AutomationError(
      "TOKEN_EXPIRED",
      "The ScriptAI integration token has expired.",
      401,
    );
  }
  const missing = requiredScopes.filter(
    (scope) => !record.scopes?.includes(scope),
  );
  if (missing.length) {
    throw new AutomationError(
      "TOKEN_SCOPE_MISSING",
      `The ScriptAI token is missing ${missing.join(", ")}.`,
      403,
    );
  }
  return record;
}
