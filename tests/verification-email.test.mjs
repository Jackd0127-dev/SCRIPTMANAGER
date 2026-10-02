import test from "node:test";
import assert from "node:assert/strict";
import { createVerificationEmailHandler, deliverVerificationTemplate, reserveVerificationAllowance } from "../server/verification-email.js";
import { requestVerificationEmail } from "../assets/js/verification-email.js";

function database() {
  const documents = new Map();
  return { documents, collection: () => ({ doc: id => id }), runTransaction: async callback => callback({ get: async id => ({ data: () => documents.get(id) }), set: (id, value) => documents.set(id, value) }) };
}
function response() {
  return { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
function fixture() {
  const calls = [], db = database();
  const auth = {
    verifyIdToken: async (token, revoked) => { calls.push(["verify", token, revoked]); return { uid: "owner" }; },
    getUser: async uid => ({ uid, email: "Owner@Example.com", emailVerified: false, disabled: false }),
    generateEmailVerificationLink: async email => { calls.push(["link", email]); return "https://social-media-script.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=synthetic&apiKey=public"; },
  };
  const handler = createVerificationEmailHandler({ getAuth: () => auth, getDb: () => db, getApiKey: () => "synthetic-key", send: async input => calls.push(["send", input]) });
  const req = { method: "POST", headers: { origin: "https://scriptai.space", "content-type": "application/json", authorization: `Bearer ${"x".repeat(200)}` }, body: { action: "verify-email" } };
  return { calls, db, auth, handler, req };
}

test("recipient and secure link come from a revocation-checked current identity", async () => {
  const f = fixture(), res = response();
  await f.handler(f.req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.calls[0], ["verify", "x".repeat(200), true]);
  assert.equal(f.calls.find(c => c[0] === "send")[1].email, "owner@example.com");
  assert.equal(f.calls.find(c => c[0] === "send")[1].actionUrl.includes("oobCode=synthetic"), true);
});

test("invalid origins, recipients and oversized input never generate codes", async () => {
  for (const change of [{ headers: { origin: "https://foreign.example" } }, { body: { action: "verify-email", email: "other@example.com" } }, { body: "x".repeat(1025) }, { headers: { authorization: "Bearer invalid" } }]) {
    const f = fixture(), res = response();
    await f.handler({ ...f.req, ...change, headers: { ...f.req.headers, ...change.headers } }, res);
    assert.equal([400, 401, 403, 413].includes(res.statusCode), true);
    assert.equal(f.calls.some(c => c[0] === "link" || c[0] === "send"), false);
  }
});

test("revoked, disabled, mismatched and already verified identities do not send", async () => {
  for (const unavailable of ["revoked", "disabled", "mismatched", "verified"]) {
    const f = fixture(), res = response();
    if (unavailable === "revoked") f.auth.verifyIdToken = async () => { throw new Error("revoked"); };
    else f.auth.getUser = async () => ({ uid: unavailable === "mismatched" ? "another" : "owner", email: "owner@example.com", disabled: unavailable === "disabled", emailVerified: unavailable === "verified" });
    await f.handler(f.req, res);
    assert.equal([400, 401].includes(res.statusCode), true);
    assert.equal(f.calls.some(c => c[0] === "send"), false);
  }
});

test("repeated verification requests retain a durable budget", async () => {
  const f = fixture();
  for (let index = 0; index < 5; index++) { const res = response(); await f.handler(f.req, res); assert.equal(res.statusCode, 200); }
  const res = response(); await f.handler(f.req, res);
  assert.equal(res.statusCode, 429);
  assert.ok(Number(res.headers["Retry-After"]) > 0);
  assert.equal(f.calls.filter(c => c[0] === "send").length, 5);
});

test("persistent limits share IP and daily budgets and fail closed before writes", async () => {
  const db = database(), now = Date.parse("2026-10-02T12:00:00Z");
  for (let index = 0; index < 8; index++) assert.equal((await reserveVerificationAllowance(db, { uid: `user-${index}`, email: `user-${index}@example.com`, ip: "shared", now })).allowed, true);
  assert.equal((await reserveVerificationAllowance(db, { uid: "last", email: "last@example.com", ip: "shared", now })).allowed, false);
  const global = [...db.documents.entries()].find(([, value]) => value.dimension === "global");
  db.documents.set(global[0], { ...global[1], used: 1000 });
  assert.equal((await reserveVerificationAllowance(db, { uid: "another", email: "another@example.com", ip: "fresh", now: now + 60 * 60 * 1000 })).allowed, false);
});

test("template send uses published defaults and safe variables with a stable idempotency key", async () => {
  const requests = [], input = { apiKey: "synthetic-key", email: "owner@example.com", actionUrl: "https://social-media-script.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=synthetic", fetcher: async (_url, options) => { requests.push(options); return { ok: true }; } };
  await deliverVerificationTemplate(input); await deliverVerificationTemplate(input);
  const message = JSON.parse(requests[0].body);
  assert.deepEqual(Object.keys(message).sort(), ["tags", "template", "to"]);
  assert.equal(message.template.id, "scriptai-email-verification");
  assert.deepEqual(message.template.variables, { ACTION_URL: input.actionUrl.replaceAll("&", "&amp;") });
  assert.equal(requests[0].headers["Idempotency-Key"], requests[1].headers["Idempotency-Key"]);
});

test("provider failures cannot expose response bodies or trigger another transport", async () => {
  await assert.rejects(deliverVerificationTemplate({ apiKey: "synthetic", email: "owner@example.com", actionUrl: "https://social-media-script.firebaseapp.com/?mode=verifyEmail&oobCode=synthetic", fetcher: async () => ({ ok: false, text: () => { throw new Error("private body must not be read"); } }) }), { message: "Email provider rejected the request." });
  await assert.rejects(deliverVerificationTemplate({ apiKey: "synthetic", email: "owner@example.com", actionUrl: "https://example.com/?mode=resetPassword&oobCode=synthetic", fetcher: async () => { throw new Error("must not send"); } }), { message: "Invalid provider action." });
});

test("signup and resend client requests use the same server contract and respect rejection", async () => {
  const requests = [], user = { getIdToken: async force => { assert.equal(force, true); return "synthetic-token"; } };
  await requestVerificationEmail(user, async (url, options) => { requests.push({ url, ...options }); return { ok: true }; });
  assert.equal(requests[0].url, "/api/verification-email");
  assert.deepEqual(JSON.parse(requests[0].body), { action: "verify-email" });
  assert.equal(requests[0].headers.Authorization, "Bearer synthetic-token");
  await assert.rejects(requestVerificationEmail(user, async () => ({ ok: false, status: 429 })), { code: "auth/too-many-requests" });
});
