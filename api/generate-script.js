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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 500, { error: "Missing GEMINI_API_KEY" });

  const mode = req.body?.mode === "custom" ? "custom" : "auto";
  const instructions = String(req.body?.instructions || "").trim().slice(0, 4000);
  const currentName = String(req.body?.currentName || "").trim().slice(0, 160);
  const currentScript = String(req.body?.currentScript || "").trim().slice(0, 12000);
  const platforms = Array.isArray(req.body?.platforms) ? req.body.platforms.map(p => String(p).slice(0, 30)).join(", ") : "TikTok, Instagram, YouTube, X";

  if (mode === "custom" && !instructions && !currentName && !currentScript) {
    return send(res, 400, { error: "Tell Gemini what you want first." });
  }

  const prompt = `Generate a creator script for Director.

Return JSON only, with this exact shape:
{
  "title": "short punchy script name",
  "script": "full raw creator script with clear sections, spoken lines, shot ideas, transitions, captions, and CTA"
}

Context:
- Platforms: ${platforms || "general social video"}.
- Current script name, if any: ${currentName || "none"}.
- Current draft, if any: ${currentScript || "none"}.
- Mode: ${mode === "custom" ? "follow the user's instructions closely" : "Gemini chooses the strongest title and script concept"}.
- User instructions: ${instructions || "Choose a strong concept yourself. Create a useful original script that is ready to be sorted into production blocks."}

Rules:
- Make the title specific and under 80 characters.
- The script should be original, practical, and ready for filming.
- Include enough detail for shots, voiceover, on-screen text, transitions, and CTA.
- Keep it concise enough for a short-form creator video unless the user asks otherwise.
- Do not add markdown fences.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: mode === "custom" ? 0.62 : 0.78,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error("Gemini generate error:", data);
      return send(res, 502, { error: "Gemini could not generate a script." });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
    const parsed = parseGeminiJson(text);
    const title = String(parsed.title || "").trim().slice(0, 80);
    const script = String(parsed.script || "").trim();

    if (!title || !script) return send(res, 422, { error: "Gemini did not return a complete script." });

    return send(res, 200, { title, script });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: "Could not generate script." });
  }
}
