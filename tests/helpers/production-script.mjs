export function productionScript(overrides = {}) {
  const key = "personal-creator:2026-08-02:AUG-D02-A:script";
  const spoken = "I am testing two honest opening lines today.";
  return {
    scriptAutomationKey: key,
    name: "AUG-D02-A — Testing an honest opening",
    status: "draft",
    dueDate: "2026-08-03",
    targetDurationSeconds: { min: 15, max: 15 },
    masterSpokenText: spoken,
    firstSecondHook: spoken,
    payoff: spoken,
    callToActionOrNextMilestone: spoken,
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
      {
        automationBlockKey: `${key}.direction.1`,
        order: 3,
        label: "Opening delivery",
        timeRange: { startSeconds: 0, endSeconds: 1 },
        type: "direction",
        direction: "Deliver the opening firmly without a greeting.",
      },
      {
        automationBlockKey: `${key}.transition.1`,
        order: 4,
        label: "Opening cut",
        timeRange: { startSeconds: 6, endSeconds: 6.2 },
        type: "transition",
        transition: "Use one clean hard cut.",
      },
    ],
    productionNotes: "Planning only; no provider action.",
    contentBacklink: { origin: "https://content.novasagency.com" },
    ...overrides,
  };
}

