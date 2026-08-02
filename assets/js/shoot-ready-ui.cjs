(function exposeShootReadyUi(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.ScriptAiShootReady = api;
})(typeof window !== "undefined" ? window : globalThis, function createShootReadyUi() {
  function isSpokenType(type) {
    return type === "speech" || type === "voiceover";
  }

  function blockSeconds(block) {
    const start = Number(block?.timeRange?.startSeconds);
    const end = Number(block?.timeRange?.endSeconds);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
      return "Timing not set";
    return `${start}–${end}s`;
  }

  function rangesOverlap(left, right) {
    const leftStart = Number(left?.timeRange?.startSeconds);
    const leftEnd = Number(left?.timeRange?.endSeconds);
    const rightStart = Number(right?.timeRange?.startSeconds);
    const rightEnd = Number(right?.timeRange?.endSeconds);
    return (
      [leftStart, leftEnd, rightStart, rightEnd].every(Number.isFinite) &&
      leftStart < rightEnd &&
      rightStart < leftEnd
    );
  }

  function overlappingSpokenBlocks(shot, blocks) {
    return (blocks || []).filter(
      (block) => isSpokenType(block.type) && rangesOverlap(shot, block),
    );
  }

  function runtimeLabel(script) {
    const min = Number(script?.targetDurationSeconds?.min);
    const max = Number(script?.targetDurationSeconds?.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "Runtime not set";
    return min === max ? `${min}s target` : `${min}–${max}s target`;
  }

  function subtitleLabel(block) {
    if (block?.type !== "subtitle") return "";
    return block.subtitleKind === "spoken_caption"
      ? "Spoken caption"
      : "Editorial on-screen text";
  }

  function exportBlockLines(block, index) {
    const type = String(block?.type || "direction");
    const subtype = subtitleLabel(block);
    const heading = `${String(index + 1).padStart(2, "0")}. [${blockSeconds(block)}] [${type}${subtype ? ` · ${subtype}` : ""}]`;
    const body = isSpokenType(type)
      ? block.spoken || ""
      : type === "subtitle"
        ? block.spoken || ""
        : [block.shotName, block.desc].filter(Boolean).join(" - ");
    const lines = [`${heading} ${body || "Untitled block"}`];
    if (type === "subtitle" && block.sourceSpeechBlockKey)
      lines.push(`    Linked speech: ${block.sourceSpeechBlockKey}`);
    if (block.notes) lines.push(`    Notes: ${block.notes}`);
    return lines;
  }

  function mergeBrowserConnection(existing, draft) {
    if (!existing) return draft;
    return {
      ...existing,
      novasFlow: draft.novasFlow,
    };
  }

  return {
    blockSeconds,
    exportBlockLines,
    isSpokenType,
    mergeBrowserConnection,
    overlappingSpokenBlocks,
    rangesOverlap,
    runtimeLabel,
    subtitleLabel,
  };
});
