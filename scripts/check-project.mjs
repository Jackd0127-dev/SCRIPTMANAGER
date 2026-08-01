import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const htmlFiles = ["index.html", "scriptai.html"];
const jsFiles = [
  "api/generate-script.js",
  "api/sort-script.js",
  "api/lib/gemini.js",
  "api/lib/gemini-prompts.js",
  "api/lib/request-security.js",
  "assets/js/launcher.js",
  "assets/js/director-auth.js",
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
const promptJs = readFileSync("api/lib/gemini-prompts.js", "utf8");
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
  vercelConfig.includes("X-Content-Type-Options"),
  "Vercel security headers are missing",
);

for (const privateTerm of ["Jack Doyle", "Casey", "New Money", "Curate"]) {
  assert(
    !promptJs.includes(privateTerm) && !directorJs.includes(privateTerm),
    `Public ScriptAI code contains private creator context: ${privateTerm}`,
  );
}

const { isAllowedOrigin } = await import("../api/lib/request-security.js");
assert(isAllowedOrigin("https://scriptai.space"), "Production origin is denied");
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
