// Shared server code lives outside /api so Vercel does not deploy it as a route.
import { createHash, randomUUID } from "node:crypto";

import { AutomationError } from "./automation-errors.js";
import {
  scriptUpsertSchema,
  validateProductionScript,
} from "./creator-planning-contract.js";

const MANAGED_BY = "creator-planning-automation";

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  return value;
}

function sourceHash(value) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function deterministicProjectId(scriptAutomationKey) {
  return `project-auto-${createHash("sha256")
    .update(scriptAutomationKey.split(":script")[0])
    .digest("hex")
    .slice(0, 32)}`;
}

function displayFields(block) {
  if (block.type === "speech" || block.type === "voiceover")
    return { desc: "", spoken: block.spokenText };
  if (block.type === "subtitle") return { desc: "", spoken: block.text };
  if (block.type === "shot") return { desc: block.shotDirection, spoken: "" };
  if (block.type === "transition") return { desc: block.transition, spoken: "" };
  return { desc: block.direction, spoken: "" };
}

function managedBlockPayload(block) {
  const common = {
    automationBlockKey: block.automationBlockKey,
    order: block.order,
    label: block.shotName || block.label || "Block",
    timeRange: block.timeRange,
    notes: block.notes || undefined,
  };
  if (block.type === "speech" || block.type === "voiceover")
    return { ...common, type: block.type, spokenText: block.spoken || "" };
  if (block.type === "subtitle")
    return {
      ...common,
      type: block.type,
      subtitleKind: block.subtitleKind,
      text: block.spoken || "",
      sourceSpeechBlockKey: block.sourceSpeechBlockKey,
    };
  if (block.type === "shot")
    return { ...common, type: block.type, shotDirection: block.desc || "" };
  if (block.type === "transition")
    return { ...common, type: block.type, transition: block.desc || "" };
  return { ...common, type: "direction", direction: block.desc || "" };
}

function mapManagedBlock(input, existing, syncedAt) {
  const display = displayFields(input);
  const hash = sourceHash(input);
  return {
    id: existing?.id || randomUUID(),
    type: input.type,
    shotName: input.label,
    desc: display.desc,
    spoken: display.spoken,
    notes: input.notes || "",
    done: existing?.done === true,
    cut: existing?.cut === true,
    automationBlockKey: input.automationBlockKey,
    order: input.order,
    timeRange: input.timeRange,
    ...(input.type === "subtitle"
      ? {
          subtitleKind: input.subtitleKind,
          sourceSpeechBlockKey: input.sourceSpeechBlockKey,
        }
      : {}),
    automation: {
      key: input.automationBlockKey,
      managedBy: MANAGED_BY,
      sourceHash: hash,
      lastSyncedAt: syncedAt,
    },
  };
}

function canonicalStoredScript(script) {
  const managedBlocks = (script.blocks || [])
    .filter(
      (block) =>
        block.automation?.managedBy === MANAGED_BY && block.automationBlockKey,
    )
    .map(managedBlockPayload)
    .sort((left, right) => left.order - right.order);
  return {
    scriptAutomationKey: script.scriptAutomationKey,
    name: script.name,
    status: script.status,
    dueDate: script.due,
    targetDurationSeconds: script.targetDurationSeconds,
    platforms: script.platforms,
    projectRef: script.projectRef,
    blocks: managedBlocks,
    productionNotes: script.notes,
    contentBacklink: { origin: script.novasFlow?.origin },
  };
}

function publicScriptResult(script, action) {
  return {
    action,
    scriptId: script.id,
    title: script.name,
    status: script.status,
    dueDate: script.due,
    platforms: script.platforms,
    recordVersion: script.recordVersion,
    contentBacklink: {
      origin: script.novasFlow.origin,
      contentId: script.novasFlow.contentId,
    },
  };
}

function resolveProject(workspace, input, existing) {
  const projects = Array.isArray(workspace.projects) ? workspace.projects : [];
  if (input.projectRef) {
    const project = projects.find((candidate) => candidate.id === input.projectRef.id);
    if (!project || String(project.name).trim().toLocaleLowerCase("en-GB") !== input.projectRef.expectedName.trim().toLocaleLowerCase("en-GB"))
      throw new AutomationError(
        "CONTEXT_STALE",
        "The ScriptAI project mapping is stale or renamed.",
        409,
      );
    return { projects, project };
  }
  const existingProject = existing
    ? projects.find((project) => project.id === existing.projectId)
    : null;
  if (existingProject) return { projects, project: existingProject };
  const id = deterministicProjectId(input.scriptAutomationKey);
  const deterministic = projects.find((project) => project.id === id);
  if (deterministic) return { projects, project: deterministic };
  const project = {
    id,
    name: "Creator Planning",
    color: workspace.settings?.accent || "#c85743",
    automation: { managedBy: MANAGED_BY, key: "creator-planning-project" },
  };
  return { projects: [...projects, project], project };
}

export function findScriptByAutomationKey(workspace, key) {
  const matches = (workspace?.scripts || []).filter(
    (script) => script.scriptAutomationKey === key,
  );
  if (matches.length > 1)
    throw new AutomationError(
      "AUTOMATION_KEY_CONFLICT",
      "More than one ScriptAI record uses this automation key.",
      409,
    );
  return matches[0] || null;
}

export function upsertAutomatedScript(workspaceInput, rawInput, now = new Date()) {
  const parsed = scriptUpsertSchema.parse(rawInput);
  const semantic = validateProductionScript(parsed.script);
  if (semantic.issues[0])
    throw new AutomationError(
      semantic.issues[0].code,
      semantic.issues[0].message,
      422,
    );
  const input = semantic.script;
  const workspace = {
    ...(workspaceInput || {}),
    projects: Array.isArray(workspaceInput?.projects) ? workspaceInput.projects : [],
    scripts: Array.isArray(workspaceInput?.scripts) ? workspaceInput.scripts : [],
  };
  const existingByKey = findScriptByAutomationKey(
    workspace,
    input.scriptAutomationKey,
  );
  const linkedMatches = workspace.scripts.filter(
    (script) =>
      script.novasFlow?.origin === input.contentBacklink.origin &&
      script.novasFlow?.contentId === parsed.contentId,
  );
  if (linkedMatches.length > 1)
    throw new AutomationError(
      "SCRIPT_LINK_CONFLICT",
      "More than one ScriptAI record is linked to this content item.",
      409,
    );
  const existing = existingByKey || linkedMatches[0] || null;
  if (
    existing &&
    (existing.novasFlow?.origin !== input.contentBacklink.origin ||
      existing.novasFlow?.contentId !== parsed.contentId)
  )
    throw new AutomationError(
      "SCRIPT_LINK_CONFLICT",
      "This script automation key is linked to a different content item.",
      409,
    );
  if (
    existing &&
    existing.scriptAutomationKey &&
    existing.scriptAutomationKey !== input.scriptAutomationKey
  )
    throw new AutomationError(
      "SCRIPT_LINK_CONFLICT",
      "This content item is linked to a different script automation key.",
      409,
    );

  const incomingHash = sourceHash(input);
  if (existing?.automation?.sourceHash) {
    const currentHash = sourceHash(canonicalStoredScript(existing));
    const managedWasEdited = currentHash !== existing.automation.sourceHash;
    const replacementAuthorized =
      parsed.conflictPolicy === "replace_managed_only" &&
      parsed.expectedRecordVersion === existing.recordVersion;
    if (managedWasEdited && currentHash !== incomingHash && !replacementAuthorized)
      throw new AutomationError(
        "MANUAL_EDIT_CONFLICT",
        "Automation-managed ScriptAI fields were edited manually.",
        409,
      );
    if (!managedWasEdited && incomingHash === existing.automation.sourceHash)
      return {
        workspace,
        result: publicScriptResult(existing, "unchanged"),
        updatedAt: now.toISOString(),
      };
  }

  const syncedAt = now.toISOString();
  const { projects, project } = resolveProject(workspace, input, existing);
  const existingManaged = new Map(
    (existing?.blocks || [])
      .filter((block) => block.automationBlockKey)
      .map((block) => [block.automationBlockKey, block]),
  );
  const managedBlocks = input.blocks
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((block) =>
      mapManagedBlock(block, existingManaged.get(block.automationBlockKey), syncedAt),
    );
  const userBlocks = (existing?.blocks || []).filter(
    (block) => block.automation?.managedBy !== MANAGED_BY,
  );
  const next = {
    ...(existing || {}),
    id: existing?.id || randomUUID(),
    projectId: project.id,
    projectRef: input.projectRef,
    name: input.name,
    status: "draft",
    due: input.dueDate,
    platforms: input.platforms,
    targetDurationSeconds: input.targetDurationSeconds,
    notes: input.productionNotes,
    blocks: [...managedBlocks, ...userBlocks],
    scriptAutomationKey: input.scriptAutomationKey,
    recordVersion: (existing?.recordVersion || 0) + 1,
    automation: {
      key: input.scriptAutomationKey,
      managedBy: MANAGED_BY,
      sourceHash: incomingHash,
      lastSyncedAt: syncedAt,
    },
    novasFlow: {
      origin: input.contentBacklink.origin,
      contentId: parsed.contentId,
      contentTitle: input.name,
      connectedAt: existing?.novasFlow?.connectedAt || syncedAt,
      syncedAt,
    },
  };
  const scripts = existing
    ? workspace.scripts.map((script) => (script.id === existing.id ? next : script))
    : [...workspace.scripts, next];
  return {
    workspace: { ...workspace, projects, scripts },
    result: publicScriptResult(next, existing ? "updated" : "created"),
    updatedAt: syncedAt,
  };
}

export function scriptLinkStatus(workspace, scriptId, expectedContentId) {
  const script = (workspace?.scripts || []).find((candidate) => candidate.id === scriptId);
  if (!script) return { exists: false, matches: false };
  const contentBacklink = {
    origin: script.novasFlow?.origin,
    contentId: script.novasFlow?.contentId,
  };
  return {
    exists: true,
    matches:
      contentBacklink.origin === "https://content.novasagency.com" &&
      contentBacklink.contentId === expectedContentId,
    contentBacklink,
  };
}

export function scriptResultByAutomationKey(workspace, key) {
  const script = findScriptByAutomationKey(workspace, key);
  if (!script)
    throw new AutomationError(
      "RECORD_NOT_FOUND",
      "ScriptAI automation script not found.",
      404,
    );
  return publicScriptResult(script, "reused");
}
