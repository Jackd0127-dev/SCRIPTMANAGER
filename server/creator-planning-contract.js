// Shared server code lives outside /api so Vercel does not deploy it as a route.
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
    longerRuntimeReason: z.string().trim().max(2000).optional(),
    masterSpokenText: text(30000),
    firstSecondHook: text(2000),
    payoff: text(2000),
    callToActionOrNextMilestone: text(2000),
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

function wordCount(value) {
  return String(value || "").trim().split(/\s+/u).filter(Boolean).length;
}

function completedSentenceCount(value) {
  return String(value || "").match(/[.!?](?=\s|$)/gu)?.length || 0;
}

function productionActionJoinCount(value) {
  return String(value || "").match(/\b(?:and|then|after that|before)\b/giu)?.length || 0;
}

function atomicBlock(block) {
  const value = blockText(block).trim();
  const duration = block.timeRange.endSeconds - block.timeRange.startSeconds;
  if (/\r|\n|;/u.test(value)) return false;
  if (["speech", "voiceover"].includes(block.type))
    return (
      duration <= 10 &&
      wordCount(value) <= 32 &&
      completedSentenceCount(value) <= 1
    );
  if (block.type === "subtitle")
    return wordCount(value) <= 32 && completedSentenceCount(value) <= 1;
  return (
    duration <= 12 &&
    wordCount(value) <= 40 &&
    completedSentenceCount(value) <= 1 &&
    productionActionJoinCount(value) <= 2
  );
}

export function canonicalizeProductionScript(script) {
  return {
    ...script,
    platforms: [...new Set(script.platforms)].sort(),
    blocks: [...script.blocks].sort((left, right) => left.order - right.order),
  };
}

export function validateProductionScript(script) {
  const parsed = productionScriptSchema.parse(script);
  const issues = [];
  if (parsed.targetDurationSeconds.min > parsed.targetDurationSeconds.max)
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "Script minimum duration cannot exceed its maximum.",
    });
  if (parsed.targetDurationSeconds.min < 15)
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "Creator-planning scripts normally target at least 15 seconds.",
    });
  if (
    parsed.targetDurationSeconds.max > 35 &&
    (wordCount(parsed.longerRuntimeReason) < 5 ||
      /\[[A-Z][A-Z0-9 _-]*\]/u.test(parsed.longerRuntimeReason || ""))
  )
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "A script longer than 35 seconds needs a specific explicit reason.",
    });
  if (new Set(parsed.platforms.map(normalize)).size !== parsed.platforms.length)
    issues.push({
      code: "AUTOMATION_KEY_CONFLICT",
      message: "Script platforms must not contain duplicates.",
    });
  const keys = new Set();
  const orders = new Set();
  const byKey = new Map(parsed.blocks.map((block) => [block.automationBlockKey, block]));
  const canonicalBlocks = [...parsed.blocks].sort(
    (left, right) => left.order - right.order,
  );
  let priorStart = -1;
  canonicalBlocks.forEach((block, index) => {
    if (block.order !== index || block.timeRange.startSeconds < priorStart)
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: "Block order values must be contiguous and follow the canonical timeline.",
      });
    priorStart = Math.max(priorStart, block.timeRange.startSeconds);
  });
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
      /(?:\b(?:target runtime|runtime|say|on-screen|cuts?|caption|hashtags?|shots?|direction|transition|seconds?)\s*:|\b\d+(?:\.\d+)?\s*(?:-|–|—)\s*\d+(?:\.\d+)?\s*(?:s|seconds?)\b|\[(?:SHOT|CUT|DIRECTION|TRANSITION|CAPTION)\])/iu.test(block.spokenText)
    )
      issues.push({
        code: "PUBLISHING_ACTION_FORBIDDEN",
        message: "Spoken blocks may contain only exact spoken words.",
      });
    if (
      block.type === "subtitle" &&
      (/(?:^|\s)#[\p{L}\p{N}_]+/u.test(block.text) ||
        /\b(?:social caption|post caption|hashtags?|link in bio)\s*:|https?:\/\//iu.test(block.text))
    )
      issues.push({
        code: "PUBLISHING_ACTION_FORBIDDEN",
        message: "Subtitle blocks may contain only visible in-video text.",
      });
    if (
      ["shot", "transition", "direction"].includes(block.type) &&
      /\b(?:say|voiceover|dialogue|spoken line|jack says)\s*:/iu.test(blockText(block))
    )
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: "Production-direction blocks cannot contain dialogue.",
      });
    if (!atomicBlock(block))
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: "Split independently timed or filmable events into atomic blocks.",
      });
    if (block.type === "subtitle" && block.subtitleKind === "spoken_caption") {
      const source = block.sourceSpeechBlockKey
        ? byKey.get(block.sourceSpeechBlockKey)
        : null;
      if (
        !source ||
        !["speech", "voiceover"].includes(source.type) ||
        normalize(block.text) !== normalize(source.spokenText) ||
        block.timeRange.startSeconds !== source.timeRange.startSeconds ||
        block.timeRange.endSeconds !== source.timeRange.endSeconds
      )
        issues.push({
          code: "MISSING_REQUIRED_FIELD",
          message: "Spoken captions must match one linked spoken block in text and time.",
        });
    }
    if (
      block.type === "subtitle" &&
      block.subtitleKind === "editorial_text" &&
      block.sourceSpeechBlockKey
    )
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: "Editorial text must not be linked as a spoken caption.",
      });
  }
  const shots = canonicalBlocks.filter((block) => block.type === "shot");
  const spoken = canonicalBlocks.filter((block) =>
    ["speech", "voiceover"].includes(block.type),
  );
  if (!spoken.length)
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "A shoot-ready script needs at least one spoken block.",
    });
  for (const type of ["shot", "direction", "transition", "subtitle"])
    if (!parsed.blocks.some((block) => block.type === type))
      issues.push({
        code: "MISSING_REQUIRED_FIELD",
        message: `A shoot-ready script needs a separate ${type} event.`,
      });
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
  const orderedSpokenText = spoken.map((block) => block.spokenText).join(" ");
  if (normalize(orderedSpokenText) !== normalize(parsed.masterSpokenText))
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "Ordered spoken blocks must completely cover the master spoken script.",
    });
  if (
    !spoken[0] ||
    spoken[0].timeRange.startSeconds > 1 ||
    !normalize(spoken[0].spokenText).includes(normalize(parsed.firstSecondHook))
  )
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "The first-second hook must appear in the earliest timed spoken block.",
    });
  if (!normalize(orderedSpokenText).includes(normalize(parsed.payoff)))
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "The payoff must appear in the spoken sequence.",
    });
  if (
    !normalize(orderedSpokenText).includes(
      normalize(parsed.callToActionOrNextMilestone),
    )
  )
    issues.push({
      code: "MISSING_REQUIRED_FIELD",
      message: "The CTA or next milestone must appear in the spoken sequence.",
    });
  const platformSet = [...new Set(parsed.platforms)].sort().join("|");
  if (platformSet !== ["Instagram", "TikTok", "YouTube"].join("|"))
    issues.push({
      code: "SCRIPT_PLATFORM_UNSUPPORTED",
      message: "Creator-planning scripts support TikTok, Instagram, and YouTube only.",
    });
  return { script: canonicalizeProductionScript(parsed), issues };
}
