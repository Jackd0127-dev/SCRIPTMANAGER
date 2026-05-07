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

const CREATOR_CONTEXT = `
Creator context:
- Creator: Jack Casey Dickson, solo iOS developer from Northern Ireland, posting as @jackcaseydickson.
- Core project: Curate, a SwiftUI/Xcode iPhone app for sorting/culling messy camera rolls, built alongside a full-time job.
- Platforms: short-form vertical video first: TikTok, Instagram Reels, YouTube Shorts, and X.
- Audience: tech-savvy people in their 20s-30s, beginner investors, indie devs, iOS learners, and people interested in building/wealth/productivity.
- Goal: build a personal brand from zero followers and create content that can later support ads and sponsorships.
- Content pillars:
  1. Investing/markets/finance: stocks, ETFs, bonds, crypto, portfolio lessons, beginner investing, global markets, property aspiration.
  2. Dev/iOS/app building: Curate build-in-public, SwiftUI, Xcode, indie dev, coding with AI, design decisions, bugs, shipping while working full time.
- Voice: natural UK/Northern Irish tone. Plainspoken, honest, direct. Not American, not hypey, not corporate, not fake guru.
- Visual rules: no screen recordings. Use face-to-camera, voiceover, B-roll, filmed phone/laptop/iPad screens, desk shots, walking/car clips, text overlays.
- Production modes:
  1. Cinematic/polished: indoors, Canon EOS 77D, DJI Mic Mini, Final Cut Pro, clean lighting.
  2. Casual/authentic: anywhere, iPhone, DJI Mic Mini, direct and rougher, more diary-like.
- Standard transitions: HARD CUT, PUSH IN, PULL OUT, OVERHEAD SHOT, WHOOSH CUT, TRACKING SHOT, WHIP PAN, PHONE THROW TRANSITION, CUTAWAY, GOLDEN REVEAL.
`;

const SCRIPT_SYSTEM = `
Script system:
- Make scripts easy for Director to sort later into production blocks.
- Prefer clear production labels in the script text: [SPEECH], [VOICEOVER], [SHOT], [SUBTITLE], [TRANSITION], [DIRECTION], [CTA], [CAPTION], [NOTES].
- Every script should have one clear idea, not five competing ideas.
- Strong short-form structure: hook in first 1-2 seconds, context, tension/problem, useful point or personal lesson, payoff, CTA.
- Hooks should be specific and slightly provocative, but believable. Avoid generic hooks like "Here are 3 tips" unless the user asks for that.
- Use concrete details from Jack's world where relevant: Curate, camera roll chaos, SwiftUI, Xcode, iPhone app dev, working full time, Trading 212, Crypto.com.
- Include B-roll ideas that are actually filmable with Jack's gear.
- Include on-screen text that is short enough for TikTok/Reels/Shorts.
- Use ;;; sparingly to mark intentional pauses in spoken lines.
- End with a soft CTA that fits the pillar, not a desperate engagement-bait line.
`;

const PILLAR_RULES = `
Pillar rules:
- If the script is investing/markets/finance:
  - Include a reminder for a "not financial advice" disclaimer, either as a short spoken line, on-screen text, or production note.
  - Do not invent current prices, returns, news, earnings, or exact portfolio values unless the user supplied them.
  - Do not tell viewers to buy, sell, or copy trades. Frame as personal thinking, lessons, mistakes, watchlists, or educational commentary.
  - Keep it knowledgeable but accessible. No stiff finance-bro language.
- If the script is dev/iOS/app-building:
  - Make it honest and specific, not a generic coding tutorial unless requested.
  - Prioritise build-in-public, product decisions, bugs, design trade-offs, AI-assisted dev, SwiftUI/Xcode lessons, and shipping around full-time work.
  - When showing code/app work, suggest filming the device or laptop as B-roll rather than screen recording.
- If the script crosses both pillars, make the connection explicit, for example: building software, building wealth, working full time, risk, consistency, leverage.
`;

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
  const length = ["short", "medium", "long"].includes(req.body?.length) ? req.body.length : "short";
  const tone = String(req.body?.tone || "punchy").trim().slice(0, 40);
  const format = String(req.body?.format || "talking-head").trim().slice(0, 60);
  const brainstorm = req.body?.brainstorm === true;

  if (mode === "custom" && !instructions && !currentName && !currentScript) {
    return send(res, 400, { error: "Tell Gemini what you want first." });
  }

  const prompt = `Generate a creator script for Director, Jack Casey Dickson's short-form script manager.

Return JSON only, with this exact shape:
{
  "title": "short punchy script name",
  "script": "full raw creator script with clear sections, spoken lines, shot ideas, transitions, captions, and CTA"
}

${CREATOR_CONTEXT}
${SCRIPT_SYSTEM}
${PILLAR_RULES}

Request context:
- Platforms: ${platforms || "general social video"}.
- Length: ${length === "short" ? "15-30 seconds" : length === "long" ? "60-120 seconds" : "30-60 seconds"}.
- Tone: ${tone}.
- Format: ${format}.
- Brainstorm mode: ${brainstorm ? "yes, include 3-5 concise concept options before the chosen script inside the script text" : "no, write the strongest complete script directly"}.
- Current script name, if any: ${currentName || "none"}.
- Current draft, if any: ${currentScript || "none"}.
- Mode: ${mode === "custom" ? "follow the user's instructions closely, while keeping Jack's content system intact" : "choose the strongest title and script concept for Jack's pillars"}.
- User instructions: ${instructions || "Choose a strong concept yourself. Create a useful original script that is ready to be sorted into production blocks."}

Output rules:
- Make the title specific, searchable, and under 80 characters.
- The script should be original, practical, and ready for filming today.
- Match the requested length. Spoken sections should not ramble.
- Include direct-to-camera speech when the format is talking-head or talking to camera.
- Include practical shot ideas, transition labels, on-screen text, caption, CTA, and notes/reminders where useful.
- Use UK spelling and natural phrasing.
- Avoid over-polished motivational language, fake certainty, and American creator clichés.
- Do not add markdown fences.
- Do not include anything outside the JSON object.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: brainstorm ? 0.82 : (mode === "custom" ? 0.62 : 0.78),
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
