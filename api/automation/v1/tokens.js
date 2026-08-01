import { randomUUID } from "node:crypto";

import {
  AutomationError,
  sendAutomationError,
} from "../../lib/automation-errors.js";
import { authorizeAutomationUserRequest } from "../../lib/automation-auth.js";
import { automationStore } from "../../lib/automation-store.js";
import {
  createScriptAiTokenValue,
  SCRIPT_AI_AUTOMATION_SCOPES,
  tokenDigest,
} from "../../lib/automation-token.js";

function publicToken(token) {
  return {
    id: token.id,
    label: token.label,
    scopes: token.scopes,
    expiresAt: token.expiresAt,
    revokedAt: token.revokedAt,
    lastUsedAt: token.lastUsedAt,
    createdAt: token.createdAt,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const { ownerId } = await authorizeAutomationUserRequest(req);
    const store = automationStore();
    if (req.method === "GET") {
      const tokens = (await store.listTokens(ownerId))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map(publicToken);
      return res.status(200).json({ tokens });
    }
    if (req.method === "POST") {
      if (!String(req.headers?.["content-type"] || "").includes("application/json"))
        throw new AutomationError("INVALID_REQUEST", "Use application/json.", 415);
      const label = String(req.body?.label || "").trim().slice(0, 120);
      const expiresAt = req.body?.expiresAt
        ? new Date(req.body.expiresAt).toISOString()
        : undefined;
      if (!label)
        throw new AutomationError(
          "MISSING_REQUIRED_FIELD",
          "A token label is required.",
          422,
        );
      if (expiresAt && new Date(expiresAt).getTime() <= Date.now())
        throw new AutomationError(
          "TOKEN_EXPIRED",
          "The token expiry must be in the future.",
          422,
        );
      const { tokenId, rawToken } = createScriptAiTokenValue();
      const at = new Date().toISOString();
      const record = {
        id: `sai-pat-${tokenId}`,
        ownerId,
        tokenHash: tokenDigest(rawToken),
        label,
        scopes: [...SCRIPT_AI_AUTOMATION_SCOPES],
        expiresAt,
        createdAt: at,
        updatedAt: at,
      };
      await store.createToken(record);
      await store.recordAudit(ownerId, "token.created", record.id, at);
      return res.status(201).json({ rawToken, token: publicToken(record) });
    }
    if (req.method === "DELETE") {
      const id = String(req.body?.id || "");
      const current = await store.getToken(id);
      if (!current || current.ownerId !== ownerId)
        throw new AutomationError("AUTH_REQUIRED", "Automation token not found.", 401);
      if (!current.revokedAt) {
        const at = new Date().toISOString();
        await store.updateToken(id, ownerId, { revokedAt: at, updatedAt: at });
        await store.recordAudit(ownerId, "token.revoked", id, at);
        current.revokedAt = at;
      }
      return res.status(200).json({ token: publicToken(current) });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendAutomationError(res, error);
  }
}
