import { centralIdentityConfiguration, centralIdentityJwks, centralIdentityMode } from "../server/central-identity.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (centralIdentityMode() === "off") return res.status(404).json({ error: "Not found" });
  try {
    const { privateKey, keyId } = centralIdentityConfiguration();
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json(centralIdentityJwks(privateKey, keyId));
  } catch {
    return res.status(503).json({ error: "Central identity linking is not configured" });
  }
}
