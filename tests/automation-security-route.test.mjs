import test from "node:test";
import assert from "node:assert/strict";

import { createTokenManagementHandler } from "../api/automation/v1/tokens.js";
import upsertScript from "../api/automation/v1/scripts/upsert.js";
import {
  MemoryAutomationStore,
  resetMemoryAutomationStore,
} from "../server/automation-store.js";
import {
  isAllowedBrowserRequest,
  isAllowedOrigin,
} from "../server/request-security.js";
import { tokenDigest } from "../server/automation-token.js";

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

function request(method, body, contentType = "application/json") {
  return { method, body, headers: { "content-type": contentType } };
}

function integrationRequest(rawToken) {
  return {
    method: "POST",
    body: {},
    headers: {
      authorization: `Bearer ${rawToken}`,
      "content-type": "application/json",
    },
  };
}

test("trusted origins are exact and similarly-prefixed Vercel hosts fail", () => {
  assert.equal(isAllowedOrigin("https://scriptmanager.vercel.app"), true);
  assert.equal(
    isAllowedOrigin("https://scriptmanager-attacker.vercel.app"),
    false,
  );
  assert.equal(
    isAllowedOrigin("https://scriptmanager.preview.vercel.app"),
    false,
  );
  assert.equal(isAllowedOrigin("https://unrelated.vercel.app"), false);
  assert.equal(isAllowedOrigin("http://127.0.0.1:3000"), true);
  assert.equal(isAllowedOrigin("http://127.0.0.1:3001"), false);
  assert.equal(isAllowedOrigin("http://localhost:9999"), false);
});

test("same-origin token reads may use exact referrer evidence but writes require Origin", () => {
  const exactRead = {
    method: "GET",
    headers: {
      referer: "https://scriptai.space/scriptai.html",
      host: "scriptai.space",
      "x-forwarded-proto": "https",
      "sec-fetch-site": "same-origin",
    },
  };
  assert.equal(isAllowedBrowserRequest(exactRead), true);
  assert.equal(
    isAllowedBrowserRequest({
      ...exactRead,
      headers: {
        ...exactRead.headers,
        referer: "https://scriptmanager-attacker.vercel.app/scriptai.html",
        host: "scriptmanager-attacker.vercel.app",
      },
    }),
    false,
  );
  assert.equal(
    isAllowedBrowserRequest({ ...exactRead, method: "POST" }),
    false,
  );
  assert.equal(
    isAllowedBrowserRequest({
      method: "POST",
      headers: { origin: "https://scriptai.space" },
    }),
    true,
  );
});

test("token route returns structured 422s and reveals the raw token only once", async () => {
  resetMemoryAutomationStore();
  const store = new MemoryAutomationStore();
  const rawToken = `sai_pat_1234567890abcdef_${"a".repeat(43)}`;
  const handler = createTokenManagementHandler({
    authorizeAutomationUserRequest: async () => ({ ownerId: "owner-a" }),
    automationStore: () => store,
    createScriptAiTokenValue: () => ({
      tokenId: "1234567890abcdef",
      rawToken,
    }),
    now: () => new Date("2026-08-02T09:00:00.000Z"),
  });

  const invalidExpiry = responseRecorder();
  await handler(
    request("POST", { label: "Codex", expiresAt: "not-a-date" }),
    invalidExpiry,
  );
  assert.equal(invalidExpiry.statusCode, 422);
  assert.equal(invalidExpiry.body.code, "INVALID_REQUEST");
  assert.equal(JSON.stringify(invalidExpiry.body).includes("RangeError"), false);

  const unknownField = responseRecorder();
  await handler(
    request("POST", { label: "Codex", scopes: ["admin"] }),
    unknownField,
  );
  assert.equal(unknownField.statusCode, 422);

  const created = responseRecorder();
  await handler(
    request("POST", {
      label: "Codex",
      expiresAt: "2026-08-03T09:00:00.000Z",
    }),
    created,
  );
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.rawToken, rawToken);
  assert.deepEqual(created.body.token.scopes, [
    "scripts:read",
    "scripts:write",
    "content-links:write",
  ]);
  const stored = await store.getToken(created.body.token.id);
  assert.equal(stored.tokenHash, tokenDigest(rawToken));
  assert.equal(JSON.stringify(stored).includes(rawToken), false);

  const listed = responseRecorder();
  await handler(request("GET"), listed);
  assert.equal(listed.statusCode, 200);
  assert.equal(JSON.stringify(listed.body).includes(rawToken), false);
  assert.equal(JSON.stringify(listed.body).includes(stored.tokenHash), false);
});

test("token route enforces owner isolation and strict revocation bodies", async () => {
  resetMemoryAutomationStore();
  const store = new MemoryAutomationStore();
  await store.createToken({
    id: "sai-pat-owner-b",
    ownerId: "owner-b",
    tokenHash: "f".repeat(64),
    label: "Owner B",
    scopes: ["scripts:read"],
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  });
  const handler = createTokenManagementHandler({
    authorizeAutomationUserRequest: async () => ({ ownerId: "owner-a" }),
    automationStore: () => store,
    now: () => new Date("2026-08-02T09:00:00.000Z"),
  });

  const extra = responseRecorder();
  await handler(
    request("DELETE", { id: "sai-pat-owner-b", force: true }),
    extra,
  );
  assert.equal(extra.statusCode, 422);

  const mismatch = responseRecorder();
  await handler(request("DELETE", { id: "sai-pat-owner-b" }), mismatch);
  assert.equal(mismatch.statusCode, 401);
  assert.equal((await store.getToken("sai-pat-owner-b")).revokedAt, undefined);
});

test("script upsert route enforces scopes, expiry, revocation, and secret redaction", async () => {
  process.env.CREATOR_PLANNING_AUTOMATION_ENABLED = "true";
  process.env.SCRIPTAI_AUTOMATION_BACKEND = "memory";
  resetMemoryAutomationStore();
  const store = new MemoryAutomationStore();
  const rawToken = `sai_pat_1234567890abcdef_${"b".repeat(43)}`;
  const base = {
    ownerId: "owner-route",
    tokenHash: tokenDigest(rawToken),
    label: "Route boundary",
    createdAt: "2026-08-02T09:00:00.000Z",
    updatedAt: "2026-08-02T09:00:00.000Z",
  };
  const cases = [
    {
      id: "sai-pat-1234567890abcdef",
      scopes: ["scripts:read"],
      expectedStatus: 403,
      expectedCode: "TOKEN_SCOPE_MISSING",
    },
    {
      id: "sai-pat-1234567890abcdef",
      scopes: ["scripts:write", "content-links:write"],
      expiresAt: "2020-01-01T00:00:00.000Z",
      expectedStatus: 401,
      expectedCode: "TOKEN_EXPIRED",
    },
    {
      id: "sai-pat-1234567890abcdef",
      scopes: ["scripts:write", "content-links:write"],
      revokedAt: "2026-08-02T09:01:00.000Z",
      expectedStatus: 401,
      expectedCode: "AUTH_REQUIRED",
    },
  ];
  for (const scenario of cases) {
    resetMemoryAutomationStore();
    await store.createToken({ ...base, ...scenario });
    const response = responseRecorder();
    await upsertScript(integrationRequest(rawToken), response);
    assert.equal(response.statusCode, scenario.expectedStatus);
    assert.equal(response.body.code, scenario.expectedCode);
    assert.equal(JSON.stringify(response.body).includes(rawToken), false);
    assert.equal(JSON.stringify(response.body).includes(base.tokenHash), false);
  }
});
