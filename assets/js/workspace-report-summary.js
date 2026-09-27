/** Counts only. The caller must save this beside the same workspace atomically. */
export function workspaceReportSummary(workspace) {
  if (!Array.isArray(workspace?.projects) || !Array.isArray(workspace?.scripts)) {
    return null;
  }
  const records = [...workspace.projects, ...workspace.scripts];
  if (records.some((record) => !record || typeof record !== "object" || Array.isArray(record))) {
    return null;
  }
  return {
    version: 1,
    projects: workspace.projects.length,
    scripts: workspace.scripts.length,
  };
}
