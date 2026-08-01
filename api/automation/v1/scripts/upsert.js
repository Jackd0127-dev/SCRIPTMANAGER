import { authorizeIntegrationRequest } from "../../../../server/automation-auth.js";
import { sendAutomationError } from "../../../../server/automation-errors.js";
import { upsertAutomatedScript } from "../../../../server/script-automation.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { ownerId, store } = await authorizeIntegrationRequest(req, [
      "scripts:write",
      "content-links:write",
    ]);
    const transaction = await store.updateWorkspace(ownerId, (workspace) =>
      upsertAutomatedScript(workspace, req.body),
    );
    return res.status(200).json(transaction.result);
  } catch (error) {
    return sendAutomationError(res, error);
  }
}
