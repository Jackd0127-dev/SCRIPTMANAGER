import test from "node:test";
import assert from "node:assert/strict";
import { workspaceReportSummary } from "../assets/js/workspace-report-summary.js";

test("reports explicitly empty workspaces without inventing missing arrays", () => {
  assert.deepEqual(workspaceReportSummary({ projects: [], scripts: [] }), { version: 1, projects: 0, scripts: 0 });
  for (const input of [null, {}, { projects: [] }, { scripts: [] }, { projects: {}, scripts: [] }]) {
    assert.equal(workspaceReportSummary(input), null);
  }
});

test("emits counts without private script, project or account data", () => {
  const workspace = {
    email: "private@example.test",
    projects: [{ id: "p", name: "Private project" }],
    scripts: [{ id: "a", blocks: [{ spoken: "Private script" }] }, { id: "b", notes: "Private notes" }],
    settings: { private: true },
  };
  const before = structuredClone(workspace);
  assert.deepEqual(workspaceReportSummary(workspace), { version: 1, projects: 1, scripts: 2 });
  assert.deepEqual(workspace, before);
});

test("a malformed saved entry makes reporting unknown, not a successful count", () => {
  for (const entry of [null, undefined, "script", 2, [], true]) {
    assert.equal(workspaceReportSummary({ projects: [], scripts: [entry] }), null);
    assert.equal(workspaceReportSummary({ projects: [entry], scripts: [] }), null);
  }
});

test("recomputes after creation, deletion and an automation replacement", () => {
  const workspace = { projects: [{ id: "p" }], scripts: [] };
  workspace.scripts.push({ id: "a" });
  assert.equal(workspaceReportSummary(workspace).scripts, 1);
  workspace.scripts[0] = { id: "a", blocks: [{ spoken: "Updated" }] };
  assert.equal(workspaceReportSummary(workspace).scripts, 1);
  workspace.scripts.splice(0, 1);
  assert.equal(workspaceReportSummary(workspace).scripts, 0);
});
