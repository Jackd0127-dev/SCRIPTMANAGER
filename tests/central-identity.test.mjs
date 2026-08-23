import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import test from "node:test";

import { centralIdentityJwks, createLegacyLinkProof } from "../server/central-identity.js";

test("creates a five minute ScriptAI identity proof", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const token = createLegacyLinkProof({ legacyUserId: "script-user", privateKey: pem, issuer: "https://scriptai.space", audience: "https://access.novasagency.com/identity-link", keyId: "test", now: 100 });
  const [header, payload, signature] = token.split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.deepEqual({ app_key: claims.app_key, legacy_user_id: claims.legacy_user_id, iat: claims.iat, exp: claims.exp }, { app_key: "scriptai", legacy_user_id: "script-user", iat: 100, exp: 400 });
  assert.equal(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url")), true);
  assert.equal(centralIdentityJwks(pem, "test").keys[0].kid, "test");
});
