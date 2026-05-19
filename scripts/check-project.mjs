import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const htmlFiles = ["index.html", "scriptai.html", "ni-rewire-guide.html"];
const jsFiles = [
  "api/generate-script.js",
  "api/sort-script.js",
  "api/lib/gemini.js",
  "assets/js/launcher.js",
  "assets/js/director-auth.js",
  "assets/js/director.js",
  "assets/js/ni-rewire-mobile.js",
  "assets/js/ni-rewire-guide.js",
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
assert(
  !directorJs.includes("MY_STUFF_PASSWORD ="),
  "Director contains a plaintext My stuff password constant",
);

const rewireCss = readFileSync("assets/css/ni-rewire-guide.css", "utf8");
assert(
  !rewireCss.includes(":root{-sidebar"),
  "NI rewire CSS contains a single-dash sidebar custom property",
);

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Project checks passed.");
