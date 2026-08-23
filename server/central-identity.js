import { createPrivateKey, createPublicKey, randomUUID, sign } from "node:crypto";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function centralIdentityMode() {
  const mode = process.env.CENTRAL_IDENTITY_MODE || "off";
  if (["off", "dual", "enforced"].includes(mode)) return mode;
  throw new Error("CENTRAL_IDENTITY_MODE must be off, dual or enforced");
}

export function centralIdentityConfiguration() {
  const privateKey = process.env.CENTRAL_IDENTITY_LINK_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey) throw new Error("CENTRAL_IDENTITY_LINK_PRIVATE_KEY is required");
  return {
    privateKey,
    issuer: process.env.CENTRAL_IDENTITY_ISSUER || "https://scriptai.space",
    audience: process.env.CENTRAL_IDENTITY_LINK_AUDIENCE || "https://access.novasagency.com/identity-link",
    keyId: process.env.CENTRAL_IDENTITY_LINK_KEY_ID || "scriptai-link-1",
  };
}

export function createLegacyLinkProof({ legacyUserId, privateKey, issuer, audience, keyId, now = Math.floor(Date.now() / 1000) }) {
  const header = encode({ alg: "RS256", typ: "JWT", kid: keyId });
  const payload = encode({ iss: issuer, aud: audience, sub: legacyUserId, app_key: "scriptai", legacy_user_id: legacyUserId, iat: now, exp: now + 300, jti: randomUUID() });
  const unsigned = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsigned), createPrivateKey(privateKey));
  return `${unsigned}.${signature.toString("base64url")}`;
}

export function centralIdentityJwks(privateKey, keyId) {
  const publicKey = createPublicKey(createPrivateKey(privateKey)).export({ format: "jwk" });
  return { keys: [{ ...publicKey, alg: "RS256", use: "sig", kid: keyId }] };
}
