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

function normalizeBlock(block) {
  const allowed = new Set(["shot", "transition", "subtitle", "voiceover", "direction"]);
  const type = allowed.has(block?.type) ? block.type : "direction";
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
  if (!rawScript) return send(res, 400, { error: "Paste a script first." });
  if (rawScript.length > 20000) return send(res, 400, { error: "Script is too long. Try a shorter version." });

  const prompt = `Sort this creator script into production blocks.

Return JSON only, with this exact shape:
{
  "title": "short script title",
  "blocks": [
    {
      "type": "shot | transition | subtitle | voiceover | direction",
      "shotName": "short label, or empty string",
      "desc": "visual/action/editing description, or empty string",
      "spoken": "spoken caption/voiceover text, or empty string"
    }
  ]
}

Rules:
- Use "shot" for camera setup, scene, b-roll, hook shot, product shot, or visual beat.
- Use "voiceover" for narration spoken by the creator.
- Use "subtitle" for on-screen text or captions.
- Use "transition" for cuts, zooms, wipes, match cuts, or edit moves.
- Use "direction" for notes, reminders, pacing, props, or production instructions.
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
            temperature: 0.2,
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
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.map(normalizeBlock) : [];

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
