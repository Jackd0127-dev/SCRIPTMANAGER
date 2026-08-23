import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { verifyProvisioningSignature } from "../server/central-provisioning.js";

test("ScriptAI provisioning requires an exact current HMAC", () => {
  const secret = "s".repeat(48);
  const body = '{"operation":"grant"}';
  const timestamp = "100";
  const signature = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
  const headers = { "x-novas-timestamp": timestamp, "x-novas-signature": signature };
  assert.equal(verifyProvisioningSignature(body, headers, secret, 100_000), true);
  assert.equal(verifyProvisioningSignature(`${body} `, headers, secret, 100_000), false);
  assert.equal(verifyProvisioningSignature(body, headers, secret, 500_000), false);
});
