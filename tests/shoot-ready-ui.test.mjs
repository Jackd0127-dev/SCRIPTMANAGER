import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const ui = require("../assets/js/shoot-ready-ui.cjs");

test("shoot-ready helpers expose runtime, seconds, subtype, and linked speech in export", () => {
  assert.equal(
    ui.runtimeLabel({ targetDurationSeconds: { min: 15, max: 35 } }),
    "15–35s target",
  );
  const caption = {
    type: "subtitle",
    subtitleKind: "spoken_caption",
    spoken: "Say this exact line.",
    sourceSpeechBlockKey: "script:speech:1",
    timeRange: { startSeconds: 0, endSeconds: 4 },
  };
  assert.equal(ui.blockSeconds(caption), "0–4s");
  assert.deepEqual(ui.exportBlockLines(caption, 0), [
    "01. [0–4s] [subtitle · Spoken caption] Say this exact line.",
    "    Linked speech: script:speech:1",
  ]);
});

test("shot cards associate only overlapping Speech or Voiceover, never captions", () => {
  const shot = {
    type: "shot",
    timeRange: { startSeconds: 4, endSeconds: 10 },
  };
  const blocks = [
    {
      id: "speech-overlap",
      type: "speech",
      timeRange: { startSeconds: 4, endSeconds: 8 },
    },
    {
      id: "voiceover-outside",
      type: "voiceover",
      timeRange: { startSeconds: 10, endSeconds: 12 },
    },
    {
      id: "caption-overlap",
      type: "subtitle",
      subtitleKind: "spoken_caption",
      timeRange: { startSeconds: 4, endSeconds: 8 },
    },
  ];
  assert.deepEqual(
    ui.overlappingSpokenBlocks(shot, blocks).map((block) => block.id),
    ["speech-overlap"],
  );
  assert.equal(ui.isSpokenType("subtitle"), false);
});

test("stale browser reconnect preserves API-managed and user-created blocks", () => {
  const managedBlock = {
    id: "managed",
    automation: { managedBy: "creator-planning-automation" },
  };
  const userBlock = { id: "user", type: "direction" };
  const existing = {
    id: "script-a",
    name: "Manually corrected title",
    blocks: [managedBlock, userBlock],
    notes: "Manual notes",
    automation: { managedBy: "creator-planning-automation" },
  };
  const merged = ui.mergeBrowserConnection(existing, {
    id: "script-a",
    name: "Incoming stale title",
    blocks: [{ id: "flattened-malformed-speech" }],
    notes: "Incoming stale notes",
    novasFlow: {
      origin: "https://content.novasagency.com",
      contentId: "content-a",
    },
  });
  assert.equal(merged.name, existing.name);
  assert.equal(merged.notes, existing.notes);
  assert.deepEqual(merged.blocks, [managedBlock, userBlock]);
  assert.equal(merged.novasFlow.contentId, "content-a");
});

test("main ScriptAI UI renders timing in every view and uses type-specific editors", () => {
  const source = readFileSync(
    new URL("../assets/js/director.js", import.meta.url),
    "utf8",
  );
  for (const view of [
    "renderFull",
    "renderShots",
    "renderTransitions",
    "renderSubtitles",
    "renderTimeline",
  ]) {
    const start = source.indexOf(`function ${view}`);
    const next = source.indexOf("\nfunction ", start + 10);
    assert.ok(source.slice(start, next).includes("blockSeconds"), `${view} seconds`);
  }
  assert.ok(source.includes("Exact words to say"));
  assert.ok(source.includes("What to film"));
  assert.ok(source.includes("Production direction"));
  assert.ok(source.includes("Transition instruction"));
  assert.ok(source.includes("In-video subtitle text"));
  assert.equal(source.includes('novasFlowBlock("subtitle", "Master caption"'), false);
});

test("production serves the browser helper as JavaScript and declares an icon", () => {
  const vercel = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  const browserHelperHeaders = vercel.headers.find(
    (entry) => entry.source === "/assets/js/shoot-ready-ui.cjs",
  );
  assert.deepEqual(browserHelperHeaders?.headers, [
    {
      key: "Content-Type",
      value: "application/javascript; charset=utf-8",
    },
  ]);
  const html = readFileSync(
    new URL("../scriptai.html", import.meta.url),
    "utf8",
  );
  assert.ok(html.includes('href="assets/icons/novas-diamond.png"'));
  assert.equal(
    createHash("sha256")
      .update(
        readFileSync(
          new URL("../assets/icons/novas-diamond.png", import.meta.url),
        ),
      )
      .digest("hex"),
    "7b5e85264de41090d293ba6d334a3ba2c34f89ec45d57f0dfe8722821ad684da",
  );
});

test("integration token settings submit and display an exact optional expiry", () => {
  const source = readFileSync(
    new URL("../assets/js/director.js", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes('id="automationTokenExpiresAt"'));
  assert.ok(source.includes('placeholder="2026-08-31T23:59:59Z"'));
  assert.ok(source.includes("...(expiresAt ? { expiresAt } : {})"));
  assert.ok(source.includes("Expires ${esc(new Date(token.expiresAt)"));
  assert.ok(source.includes('(token.scopes || []).join(", ")'));
});
