const MODEL = "gemini-2.5-flash";

function send(res, status, body) {
  res.status(status).json(body);
}

function parseGeminiJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

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
    .map(type => {
      const label = String(type?.label || type?.id || "").trim().slice(0, 28);
      const id = slugType(type?.id || label);
      return id && label ? { id, label } : null;
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeBlock(block, customTypes) {
  const allowed = new Set(["shot", "transition", "subtitle", "voiceover", "speech", "direction", ...customTypes.map(t => t.id)]);
  const rawType = slugType(block?.type);
  const type = allowed.has(rawType) ? rawType : "direction";
  return {
    type,
    shotName: String(block?.shotName || ""),
    desc: String(block?.desc || ""),
    spoken: String(block?.spoken || "")
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 500, { error: "Missing GEMINI_API_KEY" });

  const rawScript = String(req.body?.rawScript || "").trim();
  const tone = String(req.body?.tone || "punchy").slice(0, 40);
  const creativity = Math.max(0, Math.min(100, Number(req.body?.creativity ?? 52)));
  const autoShots = req.body?.autoShots !== false;
  const customTypes = normalizeCustomTypes(req.body?.customTypes);
  if (!rawScript) return send(res, 400, { error: "Paste a script first." });
  if (rawScript.length > 20000) return send(res, 400, { error: "Script is too long. Try a shorter version." });

  const prompt = `Sort this creator script into production blocks.

Return JSON only, with this exact shape:
{
  "title": "short script title",
  "blocks": [
    {
      "type": "shot | transition | subtitle | voiceover | speech | direction${customTypes.length ? " | " + customTypes.map(t => t.id).join(" | ") : ""}",
      "shotName": "short label, or empty string",
      "desc": "visual/action/editing description, or empty string",
      "spoken": "spoken caption/voiceover text, or empty string"
    }
  ]
}

Rules:
- Preferred tone: ${tone}.
- Creativity level: ${creativity}/100. Higher means stronger structure and clearer production notes while preserving the original intent.
- ${autoShots ? "Actively infer practical shot blocks when the source implies visuals." : "Only create shot blocks when the source explicitly describes visuals."}
- Use "shot" for camera setup, scene, b-roll, hook shot, product shot, or visual beat.
- Use "voiceover" for narration spoken by the creator.
- Use "speech" when the creator is talking directly to the camera, not narrating over separate visuals.
- Use "subtitle" for on-screen text or captions.
- Use "transition" for cuts, zooms, wipes, match cuts, or edit moves.
- Use "direction" for notes, reminders, pacing, props, or production instructions.
${customTypes.length ? `- You may use these custom types only when they are the best fit: ${customTypes.map(t => `${t.id} (${t.label})`).join(", ")}.` : ""}
- Preserve the original order.
- Keep blocks short and practical for filming.
- Do not add markdown.

Script:
${rawScript}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15 + (creativity / 100) * 0.55,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error("Gemini error:", data);
      return send(res, 502, { error: "Gemini could not sort this script." });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
    const parsed = parseGeminiJson(text);
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.map(block => normalizeBlock(block, customTypes)) : [];

    if (!blocks.length) return send(res, 422, { error: "Gemini did not return any script blocks." });

    return send(res, 200, {
      title: String(parsed.title || "Imported script").slice(0, 80),
      blocks
    });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: "Could not sort the script." });
  }
}
