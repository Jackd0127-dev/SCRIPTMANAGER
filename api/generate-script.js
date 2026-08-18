import { GEMINI_MODEL, parseGeminiJson, sendJson } from "../server/gemini.js";
import { buildGenerateScriptPrompt } from "../server/gemini-prompts.js";
import { authorizeAiRequest } from "../server/request-security.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST")
    return sendJson(res, 405, { error: "Method not allowed" });
  if (!(await authorizeAiRequest(req, res))) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendJson(res, 500, { error: "Missing GEMINI_API_KEY" });

  const mode = req.body?.mode === "custom" ? "custom" : "auto";
  const instructions = String(req.body?.instructions || "")
    .trim()
    .slice(0, 4000);
  const currentName = String(req.body?.currentName || "")
    .trim()
    .slice(0, 160);
  const currentScript = String(req.body?.currentScript || "")
    .trim()
    .slice(0, 12000);
  const platforms = Array.isArray(req.body?.platforms)
    ? req.body.platforms.map((p) => String(p).slice(0, 30)).join(", ")
    : "TikTok, Instagram, YouTube, X";
  const length = ["short", "medium", "long"].includes(req.body?.length)
    ? req.body.length
    : "short";
  const tone = String(req.body?.tone || "punchy")
    .trim()
    .slice(0, 40);
  const format = String(req.body?.format || "talking-head")
    .trim()
    .slice(0, 60);
  const brainstorm = req.body?.brainstorm === true;
  const creatorContext = String(req.body?.creatorContext || "")
    .trim()
    .slice(0, 3000);

  if (mode === "custom" && !instructions && !currentName && !currentScript) {
    return sendJson(res, 400, { error: "Tell Gemini what you want first." });
  }

  const prompt = buildGenerateScriptPrompt({
    brainstorm,
    creatorContext,
    currentName,
    currentScript,
    format,
    instructions,
    length,
    mode,
    platforms,
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
            temperature: brainstorm ? 0.88 : mode === "custom" ? 0.58 : 0.72,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error(`Gemini generate request failed with ${geminiRes.status}.`);
      return sendJson(res, 502, {
        error: "Gemini could not generate a script.",
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "";
    const parsed = parseGeminiJson(text);
    const title = String(parsed.title || "")
      .trim()
      .slice(0, 80);
    const script = String(parsed.script || "").trim().slice(0, 30000);

    if (!title || !script)
      return sendJson(res, 422, {
        error: "Gemini did not return a complete script.",
      });

    return sendJson(res, 200, { title, script });
  } catch {
    console.error("Script generation failed.");
    return sendJson(res, 500, { error: "Could not generate script." });
  }
}
