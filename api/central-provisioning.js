import { centralIdentityMode } from "../server/central-identity.js";
import { applyCentralProvisioning, verifyProvisioningSignature } from "../server/central-provisioning.js";

export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (centralIdentityMode() === "off") return res.status(404).json({ error: "Not found" });
  const secret = process.env.CENTRAL_IDENTITY_PROVISIONING_SECRET;
  if (!secret || secret.length < 32) return res.status(503).json({ error: "Provisioning is unavailable" });
  const body = await rawBody(req);
  if (!verifyProvisioningSignature(body, req.headers, secret)) return res.status(401).json({ error: "Invalid provisioning signature" });
  try {
    const command = JSON.parse(body);
    if (req.headers?.["idempotency-key"] !== command.idempotencyKey) throw new Error("Idempotency key mismatch");
    return res.status(200).json(await applyCentralProvisioning(command));
  } catch {
    return res.status(400).json({ error: "Invalid provisioning command" });
  }
}
