import { authorizeIntegrationRequest } from "../../../../../server/automation-auth.js";
import { sendAutomationError } from "../../../../../server/automation-errors.js";
import { scriptResultByAutomationKey } from "../../../../../server/script-automation.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const { ownerId, store } = await authorizeIntegrationRequest(req, ["scripts:read"]);
    const workspace = (await store.getWorkspace(ownerId)) || {};
    const key = decodeURIComponent(String(req.query?.encodedKey || ""));
    return res.status(200).json(scriptResultByAutomationKey(workspace, key));
  } catch (error) {
    return sendAutomationError(res, error);
  }
}
