import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const htmlFiles = ["index.html", "scriptai.html"];
const jsFiles = [
  "api/generate-script.js",
  "api/sort-script.js",
  "server/gemini.js",
  "server/gemini-prompts.js",
  "server/request-security.js",
  "server/automation-auth.js",
  "server/automation-errors.js",
  "server/automation-store.js",
  "server/automation-token.js",
  "server/creator-planning-contract.js",
  "server/firebase-admin.js",
  "server/script-automation.js",
  "api/automation/v1/tokens.js",
  "api/automation/v1/context.js",
  "api/automation/v1/scripts/upsert.js",
  "api/automation/v1/scripts/by-automation-key/[encodedKey].js",
  "api/automation/v1/scripts/[scriptId]/link-status.js",
  "assets/js/launcher.js",
  "assets/js/director-auth.js",
  "assets/js/shoot-ready-ui.cjs",
  "assets/js/director.js",
];

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const file of htmlFiles) {
  assert(existsSync(file), `Missing HTML file: ${file}`);
  const html = readFileSync(file, "utf8");
  const assetRefs = [...html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)].map(
    (match) => match[1],
  );

  assert(
    !/<style[\s>]/i.test(html),
    `${file} still contains inline <style> blocks`,
  );
  assert(
    !/<script(?![^>]*\ssrc=)[^>]*>/i.test(html),
    `${file} still contains inline <script> blocks`,
  );

  for (const asset of assetRefs) {
    assert(existsSync(asset), `${file} references missing asset: ${asset}`);
  }
}

for (const file of jsFiles) {
  assert(existsSync(file), `Missing JavaScript file: ${file}`);
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  assert(
    result.status === 0,
    `${file} failed node --check:\n${result.stderr || result.stdout}`,
  );
}

const directorJs = readFileSync("assets/js/director.js", "utf8");
const directorAuthJs = readFileSync("assets/js/director-auth.js", "utf8");
const novaThemeCss = readFileSync("assets/css/nova-theme.css", "utf8");
const promptJs = readFileSync("server/gemini-prompts.js", "utf8");
const scriptHtml = readFileSync("scriptai.html", "utf8");
const vercelConfig = readFileSync("vercel.json", "utf8");
assert(
  !directorJs.includes("MY_STUFF_PASSWORD ="),
  "Director contains a plaintext My stuff password constant",
);
assert(
  !directorJs.includes("Math.random"),
  "Script identifiers still use Math.random",
);
assert(
  !directorJs.match(/fetch\(["']\/api\/(?:generate|sort)-script/),
  "AI requests bypass the authenticated request helper",
);
assert(
  scriptHtml.includes('href="assets/css/nova-theme.css"'),
  "ScriptAI does not load the Novas Flow theme",
);
assert(
  scriptHtml.includes('id="connectionBanner"'),
  "ScriptAI is missing the Novas Flow connection surface",
);
assert(
  directorJs.includes(
    'NOVAS_FLOW_CONTENT_MESSAGE_TYPE = "novas-flow:content-context"',
  ) && directorJs.includes("beginNovasFlowConnection"),
  "ScriptAI is missing the automatic Novas Flow content handshake",
);
assert(
  directorJs.includes(
    'NOVAS_FLOW_STATUS_MESSAGE_TYPE = "novas-flow:script-status"',
  ) &&
    directorJs.includes("reportNovasFlowScriptStatus") &&
    directorAuthJs.includes("window.reportNovasFlowScriptStatus?.()"),
  "ScriptAI is missing the authenticated linked-script status handshake",
);
assert(
  directorJs.includes("linkedContentActionHtml") &&
    directorJs.includes("View content"),
  "Connected scripts are missing the reciprocal content link",
);
assert(
  !directorJs.includes("window.setTimeout(() => window.close()"),
  "ScriptAI still closes the connected browser tab",
);
assert(
  existsSync("assets/icons/chevron-down.svg") &&
    novaThemeCss.includes('background-image: url("../icons/chevron-down.svg")'),
  "ScriptAI selects are missing the shared Lucide dropdown arrow",
);
assert(
  directorJs.includes('root.setProperty("--nova-primary", accent)') &&
    directorJs.includes("generationCreatorContext()"),
  "ScriptAI appearance or generation settings are not applied",
);
assert(
  directorAuthJs.includes("window.saveNow = async") &&
    directorAuthJs.includes("settings?.autosave === false"),
  "ScriptAI autosave setting is not enforced",
);
assert(
  directorAuthJs.includes('window.S?.view === "settings"') &&
    directorJs.includes('id="settingsSaveStatus"'),
  "Saving settings can navigate away from the settings screen",
);
assert(
  directorJs.includes("window.openAddMultipleBlocks") &&
    directorJs.includes("window.createMultipleBlocks") &&
    directorJs.includes('"multi-block-modal"'),
  "ScriptAI is missing the multi-block editor",
);
assert(
  directorJs.includes('deleteIconButton("Delete project"') &&
    directorJs.includes('deleteIconButton("Delete script"'),
  "Project or script views are missing direct delete controls",
);
assert(
  !directorJs.includes('id: "copy-active"') &&
    !directorJs.includes("window.resetBlocks"),
  "Removed script Copy or Reset actions are still exposed",
);
assert(
  vercelConfig.includes("X-Content-Type-Options"),
  "Vercel security headers are missing",
);
assert(
  vercelConfig.includes("frame-ancestors 'self' https://content.novasagency.com") &&
    !vercelConfig.includes('"X-Frame-Options", "value": "DENY"'),
  "ScriptAI cannot receive trusted linked-script verification frames",
);

for (const privateTerm of ["Jack Doyle", "Casey", "New Money", "Curate"]) {
  assert(
    !promptJs.includes(privateTerm) && !directorJs.includes(privateTerm),
    `Public ScriptAI code contains private creator context: ${privateTerm}`,
  );
}

const { isAllowedOrigin } = await import("../server/request-security.js");
assert(
  isAllowedOrigin("https://scriptai.space"),
  "Production origin is denied",
);
assert(
  isAllowedOrigin("http://localhost:3000"),
  "Local development origin is denied",
);
assert(
  !isAllowedOrigin("https://scriptmanager.attacker.example"),
  "Untrusted AI origin is allowed",
);

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Project checks passed.");
