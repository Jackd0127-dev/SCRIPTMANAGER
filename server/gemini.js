// Shared server code lives outside /api so Vercel does not deploy it as a route.
export const GEMINI_MODEL = "gemini-2.5-flash";

export function sendJson(res, status, body) {
  res.status(status).json(body);
}

export function parseGeminiJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned);
}
