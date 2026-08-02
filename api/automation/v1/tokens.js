import { z } from "zod";

import {
  AutomationError,
  sendAutomationError,
} from "../../../server/automation-errors.js";
import { authorizeAutomationUserRequest } from "../../../server/automation-auth.js";
import { automationStore } from "../../../server/automation-store.js";
import {
  createScriptAiTokenValue,
  SCRIPT_AI_AUTOMATION_SCOPES,
  tokenDigest,
} from "../../../server/automation-token.js";

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

const tokenCreateSchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    expiresAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

const tokenDeleteSchema = z
  .object({ id: z.string().trim().min(1).max(128) })
  .strict();

export function createTokenManagementHandler(dependencies = {}) {
  const authorize =
    dependencies.authorizeAutomationUserRequest ||
    authorizeAutomationUserRequest;
  const getStore = dependencies.automationStore || automationStore;
  const createTokenValue =
    dependencies.createScriptAiTokenValue || createScriptAiTokenValue;
  const now = dependencies.now || (() => new Date());
  return async function tokenManagementHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    try {
      const { ownerId } = await authorize(req);
      const store = getStore();
      if (req.method === "GET") {
        const tokens = (await store.listTokens(ownerId))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
          .map(publicToken);
        return res.status(200).json({ tokens });
      }
      if (req.method === "POST") {
        if (
          !String(req.headers?.["content-type"] || "").includes(
            "application/json",
          )
        )
          throw new AutomationError(
            "INVALID_REQUEST",
            "Use application/json.",
            415,
          );
        const parsed = tokenCreateSchema.safeParse(req.body);
        if (!parsed.success)
          throw new AutomationError(
            "INVALID_REQUEST",
            "Token settings must contain only a label and a valid ISO expiry.",
            422,
          );
        const { label, expiresAt } = parsed.data;
        if (expiresAt && new Date(expiresAt).getTime() <= now().getTime())
          throw new AutomationError(
            "TOKEN_EXPIRED",
            "The token expiry must be in the future.",
            422,
          );
        const { tokenId, rawToken } = createTokenValue();
        const at = now().toISOString();
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
        if (
          !String(req.headers?.["content-type"] || "").includes(
            "application/json",
          )
        )
          throw new AutomationError(
            "INVALID_REQUEST",
            "Use application/json.",
            415,
          );
        const parsed = tokenDeleteSchema.safeParse(req.body);
        if (!parsed.success)
          throw new AutomationError(
            "INVALID_REQUEST",
            "Token revocation requires one valid token ID.",
            422,
          );
        const { id } = parsed.data;
        const current = await store.getToken(id);
        if (!current || current.ownerId !== ownerId)
          throw new AutomationError(
            "AUTH_REQUIRED",
            "Automation token not found.",
            401,
          );
        if (!current.revokedAt) {
          const at = now().toISOString();
          await store.updateToken(id, ownerId, {
            revokedAt: at,
            updatedAt: at,
          });
          await store.recordAudit(ownerId, "token.revoked", id, at);
          current.revokedAt = at;
        }
        return res.status(200).json({ token: publicToken(current) });
      }
      return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
      return sendAutomationError(res, error);
    }
  };
}

export default createTokenManagementHandler();
