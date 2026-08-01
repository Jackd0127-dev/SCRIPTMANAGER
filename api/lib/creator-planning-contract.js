import { z } from "zod";

const id = z.string().trim().min(1).max(128);
const text = (max) => z.string().trim().min(1).max(max);
const timeRange = z
  .object({
    startSeconds: z.number().finite().nonnegative(),
    endSeconds: z.number().finite().positive(),
  })
  .strict();
const base = z.object({
  automationBlockKey: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9][A-Za-z0-9:._-]*$/u),
  order: z.number().int().nonnegative(),
  label: text(160),
  timeRange,
  notes: z.string().trim().max(2000).optional(),
});

export const productionBlockSchema = z.discriminatedUnion("type", [
  base
    .extend({
      type: z.enum(["speech", "voiceover"]),
      spokenText: text(5000),
    })
    .strict(),
  base
    .extend({
      type: z.literal("subtitle"),
      subtitleKind: z.enum(["spoken_caption", "editorial_text"]),
      text: text(5000),
      sourceSpeechBlockKey: id.optional(),
    })
    .strict(),
  base
    .extend({ type: z.literal("shot"), shotDirection: text(3000) })
    .strict(),
  base
    .extend({ type: z.literal("transition"), transition: text(2000) })
    .strict(),
  base
    .extend({ type: z.literal("direction"), direction: text(3000) })
    .strict(),
]);

export const productionScriptSchema = z
  .object({
    scriptAutomationKey: z
      .string()
      .trim()
      .min(1)
      .max(240)
      .regex(/^[A-Za-z0-9][A-Za-z0-9:._-]*:script$/u),
    name: text(240),
    status: z.literal("draft"),
    dueDate: z.iso.date(),
    targetDurationSeconds: z
      .object({
        min: z.number().int().min(1).max(600),
        max: z.number().int().min(1).max(600),
      })
      .strict(),
    platforms: z
      .array(z.enum(["TikTok", "Instagram", "YouTube", "X"]))
      .min(1)
      .max(4),
    projectRef: z
      .object({ id, expectedName: text(200) })
      .strict()
      .optional(),
    blocks: z.array(productionBlockSchema).min(1).max(200),
    productionNotes: text(10000),
    contentBacklink: z
      .object({ origin: z.literal("https://content.novasagency.com") })
      .strict(),
  })
  .strict();

export const scriptUpsertSchema = z
  .object({
    script: productionScriptSchema,
    contentId: id,
    expectedRecordVersion: z.number().int().positive().optional(),
    conflictPolicy: z.literal("replace_managed_only").optional(),
  })
  .strict();

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-GB");
}

function overlap(left, right) {
  return left.startSeconds < right.endSeconds && right.startSeconds < left.endSeconds;
}

function blockText(block) {
  if (block.type === "speech" || block.type === "voiceover") return block.spokenText;
  if (block.type === "subtitle") return block.text;
  if (block.type === "shot") return block.shotDirection;
  if (block.type === "transition") return block.transition;
  return block.direction;
}

export function validateProductionScript(script) {
  const parsed = productionScriptSchema.parse(script);
  const issues = [];
  const keys = new Set();
  const orders = new Set();
  const byKey = new Map(parsed.blocks.map((block) => [block.automationBlockKey, block]));
  for (const block of parsed.blocks) {
    if (keys.has(block.automationBlockKey))
      issues.push({ code: "AUTOMATION_KEY_CONFLICT", message: "Block keys must be unique." });
    keys.add(block.automationBlockKey);
    if (orders.has(block.order))
      issues.push({ code: "AUTOMATION_KEY_CONFLICT", message: "Block orders must be unique." });
    orders.add(block.order);
    if (
      block.timeRange.endSeconds <= block.timeRange.startSeconds ||
      block.timeRange.endSeconds > parsed.targetDurationSeconds.max
    )
      issues.push({ code: "MISSING_REQUIRED_FIELD", message: "Block time ranges are invalid." });
    if (
      ["speech", "voiceover"].includes(block.type) &&
      /\b(?:target runtime|say|on-screen|cuts?|caption|hashtags?)\s*:/iu.test(
        block.spokenText,
      )
    )
      issues.push({
        code: "PUBLISHING_ACTION_FORBIDDEN",
        message: "Spoken blocks may contain only exact spoken words.",
      });
    if (
      block.type === "subtitle" &&
      (/(?:^|\s)#[\p{L}\p{N}_]+/u.test(block.text) ||
        /\b(?:caption|hashtags?|target runtime)\s*:/iu.test(block.text))
    )
      issues.push({
        code: "PUBLISHING_ACTION_FORBIDDEN",
        message: "Subtitle blocks may contain only visible in-video text.",
      });
    if (
      ["shot", "transition", "direction"].includes(block.type) &&
      /\b(?:SAY|VOICEOVER|DIALOGUE)\s*:/u.test(blockText(block))
    )
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: "Production-direction blocks cannot contain dialogue.",
      });
    if (
      block.timeRange.endSeconds - block.timeRange.startSeconds > 15 &&
      blockText(block).split(/\n+/u).filter(Boolean).length > 1
    )
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: "Split independently timed or filmable events into atomic blocks.",
      });
  }
  const shots = parsed.blocks.filter((block) => block.type === "shot");
  const spoken = parsed.blocks.filter((block) =>
    ["speech", "voiceover"].includes(block.type),
  );
  for (const block of spoken) {
    const captions = parsed.blocks.filter(
      (candidate) =>
        candidate.type === "subtitle" &&
        candidate.subtitleKind === "spoken_caption" &&
        candidate.sourceSpeechBlockKey === block.automationBlockKey,
    );
    if (
      captions.length !== 1 ||
      normalize(captions[0]?.text) !== normalize(block.spokenText) ||
      captions[0]?.timeRange.startSeconds !== block.timeRange.startSeconds ||
      captions[0]?.timeRange.endSeconds !== block.timeRange.endSeconds
    )
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: `Spoken block ${block.automationBlockKey} needs one text- and time-matched caption.`,
      });
    if (!shots.some((shot) => overlap(shot.timeRange, block.timeRange)))
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: `Spoken block ${block.automationBlockKey} needs an overlapping shot.`,
      });
  }
  const platformSet = [...new Set(parsed.platforms)].sort().join("|");
  if (platformSet !== ["Instagram", "TikTok", "YouTube"].join("|"))
    issues.push({
      code: "SCRIPT_PLATFORM_UNSUPPORTED",
      message: "Creator-planning scripts support TikTok, Instagram, and YouTube only.",
    });
  return { script: parsed, issues };
}
