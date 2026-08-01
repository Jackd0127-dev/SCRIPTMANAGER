import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertUsableToken,
  createScriptAiTokenValue,
  parseScriptAiToken,
  tokenDigest,
  tokenHashMatches,
} from "../api/lib/automation-token.js";
import {
  MemoryAutomationStore,
  resetMemoryAutomationStore,
} from "../api/lib/automation-store.js";
import {
  scriptLinkStatus,
  upsertAutomatedScript,
} from "../api/lib/script-automation.js";
import { validateProductionScript } from "../api/lib/creator-planning-contract.js";

function productionScript(overrides = {}) {
  const key = "personal-creator:2026-08-02:AUG-D02-A:script";
  const spoken = "I am testing two honest opening lines today.";
  return {
    scriptAutomationKey: key,
    name: "AUG-D02-A — Testing an honest opening",
    status: "draft",
    dueDate: "2026-08-02",
    targetDurationSeconds: { min: 6, max: 15 },
    platforms: ["TikTok", "Instagram", "YouTube"],
    blocks: [
      {
        automationBlockKey: `${key}.speech.1`,
        order: 0,
        label: "Opening",
        timeRange: { startSeconds: 0, endSeconds: 6 },
        type: "speech",
        spokenText: spoken,
      },
      {
        automationBlockKey: `${key}.caption.1`,
        order: 1,
        label: "Exact spoken caption",
        timeRange: { startSeconds: 0, endSeconds: 6 },
        type: "subtitle",
        subtitleKind: "spoken_caption",
        text: spoken,
        sourceSpeechBlockKey: `${key}.speech.1`,
      },
      {
        automationBlockKey: `${key}.shot.1`,
        order: 2,
        label: "Direct-to-camera",
        timeRange: { startSeconds: 0, endSeconds: 6 },
        type: "shot",
        shotDirection: "Static eye-level close-up.",
      },
    ],
    productionNotes: "Planning only; no provider action.",
    contentBacklink: { origin: "https://content.novasagency.com" },
    ...overrides,
  };
}

test("ScriptAI integration tokens are strong, parseable, and hash-only", () => {
  const { tokenId, rawToken } = createScriptAiTokenValue();
  assert.match(rawToken, /^sai_pat_[A-Za-z0-9_-]{16}_[A-Za-z0-9_-]{43}$/u);
  assert.equal(parseScriptAiToken(rawToken).tokenId, tokenId);
  const hash = tokenDigest(rawToken);
  assert.equal(hash.length, 64);
  assert.equal(hash.includes(rawToken), false);
  assert.equal(tokenHashMatches(hash, rawToken), true);
  assert.equal(tokenHashMatches(hash, `${rawToken}x`), false);
});

test("tokens expire clearly and each workspace remains owner-isolated", async () => {
  resetMemoryAutomationStore();
  const store = new MemoryAutomationStore();
  const { tokenId, rawToken } = createScriptAiTokenValue();
  const expired = {
    id: `sai-pat-${tokenId}`,
    ownerId: "owner-a",
    tokenHash: tokenDigest(rawToken),
    label: "Expired",
    scopes: ["scripts:read", "scripts:write", "content-links:write"],
    expiresAt: "2026-07-31T23:59:59.000Z",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
  await store.createToken(expired);
  assert.throws(
    () =>
      assertUsableToken(expired, rawToken, ["scripts:read"], new Date("2026-08-01T00:00:00.000Z")),
    (error) => error.code === "TOKEN_EXPIRED",
  );

  await store.updateWorkspace("owner-a", () => ({
    workspace: { projects: [], scripts: [{ id: "owner-a-script" }] },
    updatedAt: "2026-08-01T00:00:00.000Z",
  }));
  await store.updateWorkspace("owner-b", () => ({
    workspace: { projects: [], scripts: [{ id: "owner-b-script" }] },
    updatedAt: "2026-08-01T00:00:00.000Z",
  }));
  assert.deepEqual((await store.getWorkspace("owner-a")).scripts, [
    { id: "owner-a-script" },
  ]);
  assert.deepEqual((await store.getWorkspace("owner-b")).scripts, [
    { id: "owner-b-script" },
  ]);
});

test("first upsert and identical retry converge on stable script and block IDs", () => {
  const input = { script: productionScript(), contentId: "content-a" };
  const first = upsertAutomatedScript(
    { projects: [], scripts: [], unrelated: { keep: true } },
    input,
    new Date("2026-08-01T09:00:00.000Z"),
  );
  const second = upsertAutomatedScript(
    first.workspace,
    input,
    new Date("2026-08-01T09:01:00.000Z"),
  );

  assert.equal(first.result.action, "created");
  assert.equal(second.result.action, "unchanged");
  assert.equal(second.result.scriptId, first.result.scriptId);
  assert.deepEqual(
    second.workspace.scripts[0].blocks.map((block) => block.id),
    first.workspace.scripts[0].blocks.map((block) => block.id),
  );
  assert.deepEqual(second.workspace.unrelated, { keep: true });
  assert.deepEqual(
    scriptLinkStatus(second.workspace, second.result.scriptId, "content-a"),
    {
      exists: true,
      matches: true,
      contentBacklink: {
        origin: "https://content.novasagency.com",
        contentId: "content-a",
      },
    },
  );
});

test("safe updates preserve user blocks and editing state", () => {
  const first = upsertAutomatedScript(
    { projects: [], scripts: [] },
    { script: productionScript(), contentId: "content-a" },
  );
  first.workspace.scripts[0].blocks[0].done = true;
  first.workspace.scripts[0].blocks.push({
    id: "user-block",
    type: "note",
    shotName: "My note",
    desc: "Keep this",
    spoken: "",
  });
  const updated = upsertAutomatedScript(first.workspace, {
    script: productionScript({ name: "AUG-D02-A — Revised safe title" }),
    contentId: "content-a",
  });

  assert.equal(updated.result.action, "updated");
  assert.equal(updated.workspace.scripts[0].blocks[0].done, true);
  assert.equal(
    updated.workspace.scripts[0].blocks.some((block) => block.id === "user-block"),
    true,
  );
});

test("manual managed edits block unless the exact record version authorizes replacement", () => {
  const input = { script: productionScript(), contentId: "content-a" };
  const first = upsertAutomatedScript({ projects: [], scripts: [] }, input);
  first.workspace.scripts[0].blocks[0].spoken = "A manual rewrite";

  assert.throws(
    () => upsertAutomatedScript(first.workspace, input),
    (error) => error.code === "MANUAL_EDIT_CONFLICT",
  );
  const replaced = upsertAutomatedScript(first.workspace, {
    ...input,
    expectedRecordVersion: first.result.recordVersion,
    conflictPolicy: "replace_managed_only",
  });
  assert.equal(replaced.workspace.scripts[0].blocks[0].spoken, input.script.blocks[0].spokenText);
});

test("link conflicts and non-atomic production blocks are rejected", () => {
  const input = { script: productionScript(), contentId: "content-a" };
  const first = upsertAutomatedScript({ projects: [], scripts: [] }, input);
  assert.throws(
    () =>
      upsertAutomatedScript(first.workspace, {
        script: productionScript(),
        contentId: "different-content",
      }),
    (error) => error.code === "SCRIPT_LINK_CONFLICT",
  );

  const invalid = productionScript({
    targetDurationSeconds: { min: 6, max: 30 },
    blocks: [
      {
        automationBlockKey: "atomic.direction",
        order: 0,
        label: "Two events",
        timeRange: { startSeconds: 0, endSeconds: 20 },
        type: "direction",
        direction: "Frame the camera.\nMove to the desk.",
      },
    ],
  });
  assert.equal(
    validateProductionScript(invalid).issues.some((issue) =>
      issue.message.includes("atomic"),
    ),
    true,
  );
});

test("memory transaction preserves unrelated workspace fields", async () => {
  resetMemoryAutomationStore();
  const store = new MemoryAutomationStore();
  await store.updateWorkspace("owner-a", () => ({
    workspace: {
      projects: [],
      scripts: [],
      settings: { accent: "#123456" },
      unrelated: { keep: true },
    },
    updatedAt: "2026-08-01T09:00:00.000Z",
  }));
  await store.updateWorkspace("owner-a", (workspace) =>
    upsertAutomatedScript(workspace, {
      script: productionScript(),
      contentId: "content-a",
    }),
  );
  const workspace = await store.getWorkspace("owner-a");
  assert.deepEqual(workspace.settings, { accent: "#123456" });
  assert.deepEqual(workspace.unrelated, { keep: true });
});

test("Day 2 remediation fixture is dry-only and preserves proven IDs and links", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../fixtures/creator-planning/day-02-remediation.dry-run.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(fixture.mode, "dry_run");
  assert.equal(fixture.mutationPerformed, false);
  assert.equal(fixture.providerActionsTaken, false);
  assert.deepEqual(
    fixture.scripts.map(({ experimentId, scriptId, contentId }) => ({
      experimentId,
      scriptId,
      contentId,
    })),
    [
      {
        experimentId: "AUG-D02-A",
        scriptId: "6e568426-7ceb-4c50-a74c-a2540d94d6ac",
        contentId: "12d164b2-bbfa-41d1-a614-d51dbf9a6f52",
      },
      {
        experimentId: "AUG-D02-B",
        scriptId: "e7ae8488-1155-41ef-8787-c85656ca17be",
        contentId: "cf75794b-2410-4dfb-902a-b494c503c334",
      },
    ],
  );
  for (const script of fixture.scripts) {
    assert.deepEqual(
      script.managedBlockPlan.map((block) => block.type),
      ["speech", "subtitle", "shot", "direction", "transition"],
    );
    assert.equal(script.preserve.includes("userCreatedBlocks"), true);
    assert.match(script.blocker, /^MANUAL_EDIT_CONFLICT_/u);
  }
});
