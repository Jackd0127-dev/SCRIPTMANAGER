import { GEMINI_MODEL, parseGeminiJson, sendJson } from "./lib/gemini.js";
import { buildSortScriptPrompt } from "./lib/gemini-prompts.js";
import { authorizeAiRequest } from "./lib/request-security.js";

function slugType(label) {
  return String(label || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function normalizeCustomTypes(types) {
  if (!Array.isArray(types)) return [];
  return types
    .map((type) => {
      const label = String(type?.label || type?.id || "")
        .trim()
        .slice(0, 28);
      const id = slugType(type?.id || label);
      return id && label ? { id, label } : null;
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeBlock(block, customTypes) {
  const allowed = new Set([
    "shot",
    "transition",
    "subtitle",
    "voiceover",
    "speech",
    "direction",
    ...customTypes.map((t) => t.id),
  ]);
  const rawType = slugType(block?.type);
  const type = allowed.has(rawType) ? rawType : "direction";
  return {
    type,
    shotName: String(block?.shotName || "").slice(0, 120),
    desc: String(block?.desc || "").slice(0, 2000),
    spoken: String(block?.spoken || "").slice(0, 3000),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST")
    return sendJson(res, 405, { error: "Method not allowed" });
  if (!(await authorizeAiRequest(req, res))) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendJson(res, 500, { error: "Missing GEMINI_API_KEY" });

  const rawScript = String(req.body?.rawScript || "").trim();
  const tone = String(req.body?.tone || "punchy").slice(0, 40);
  const creativity = Math.max(
    0,
    Math.min(100, Number(req.body?.creativity ?? 52)),
  );
  const autoShots = req.body?.autoShots !== false;
  const customTypes = normalizeCustomTypes(req.body?.customTypes);
  const creatorContext = String(req.body?.creatorContext || "")
    .trim()
    .slice(0, 3000);
  if (!rawScript) return sendJson(res, 400, { error: "Paste a script first." });
  if (rawScript.length > 20000)
    return sendJson(res, 400, {
      error: "Script is too long. Try a shorter version.",
    });

  const prompt = buildSortScriptPrompt({
    autoShots,
    creativity,
    creatorContext,
    customTypes,
    rawScript,
    tone,
  });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.12 + (creativity / 100) * 0.45,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error(`Gemini sort request failed with ${geminiRes.status}.`);
      return sendJson(res, 502, {
        error: "Gemini could not sort this script.",
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "";
    const parsed = parseGeminiJson(text);
    const blocks = Array.isArray(parsed.blocks)
      ? parsed.blocks
          .slice(0, 120)
          .map((block) => normalizeBlock(block, customTypes))
      : [];

    if (!blocks.length)
      return sendJson(res, 422, {
        error: "Gemini did not return any script blocks.",
      });

    return sendJson(res, 200, {
      title: String(parsed.title || "Imported script").slice(0, 80),
      blocks,
    });
  } catch {
    console.error("Script sorting failed.");
    return sendJson(res, 500, { error: "Could not sort the script." });
  }
}
