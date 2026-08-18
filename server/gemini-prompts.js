// Shared server code lives outside /api so Vercel does not deploy it as a route.
const CREATOR_CONTEXT = `
Creator context:
- The user is an individual creator planning practical short-form content.
- Platforms may include TikTok, Instagram Reels, YouTube Shorts, and X.
- Use the creator context supplied with the request when it is present.
- Never invent personal history, employment, client results, income, audience size, product success, or expertise.

Voice:
- Natural phrasing in the preferred language supplied by the creator.
- Plainspoken, direct, honest, and grounded.
- No fake guru language.
- No American hype phrases.
- No corporate motivational filler.
- No exaggerated certainty.
- The creator should sound like a real person documenting what they are learning, building, noticing, or changing.

Visual rules:
- No screen recordings unless explicitly requested.
- Prefer face-to-camera, voiceover, filmed phone/laptop/iPad screens, desk B-roll, walking/car clips, app shots, typing, debugging, charts blurred in the background, and simple text overlays.
- Visuals must be realistic for one creator to film.

Production modes:
1. Cinematic/polished:
   - Clean lighting, controlled framing, intentional sound, and polished editing using the creator's available setup.
2. Casual/authentic:
   - Faster, diary-like, lightly edited, and practical to film with the creator's available setup.

Standard transitions:
- HARD CUT
- PUSH IN
- PULL OUT
- OVERHEAD SHOT
- WHOOSH CUT
- TRACKING SHOT
- WHIP PAN
- PHONE THROW TRANSITION
- CUTAWAY
- GOLDEN REVEAL
`;

const HOOK_ENGINE = `
Hook engine:
Every script must start with a strong hook that earns attention in the first 1-2 seconds.

A strong hook should usually use one of these patterns:

1. Specific tension:
   - "This one bug wasted my whole evening."
   - "My portfolio was green today, but not for the reason I expected."

2. Confession or mistake:
   - "I nearly overcomplicated this app feature."
   - "I made the beginner investing mistake everyone warns you about."

3. Contrarian angle:
   - "The hardest part of building an app is not the code."
   - "A green portfolio day can still teach you the wrong lesson."

4. Curiosity gap:
   - "This tiny SwiftUI change made the app feel completely different."
   - "One stock carried my portfolio today, and that is not always a good thing."

5. Relatable pain:
   - "Building an app after work sounds productive until you actually try it."
   - "Your camera roll is probably worse than you think."

6. Outcome teaser:
   - "I finally fixed the part of the app that felt clunky."
   - "Today showed me exactly why diversification matters."

Hook rules:
- The first spoken line should be short, specific, and punchy.
- Avoid generic hooks like:
  - "Here are 3 tips..."
  - "You need to know this..."
  - "This changed everything..."
  - "Nobody is talking about..."
  - "I wish I knew this sooner..."
unless the user specifically asks for that style.
- Do not use fake urgency, clickbait, or exaggerated claims.
- The hook must connect directly to the actual script payoff.
- Prefer concrete nouns over vague claims.
- Good hooks create tension, but the rest of the script must resolve that tension.
`;

const SCRIPT_SYSTEM = `
Script system:
Create short-form scripts that are practical, filmable, and built for retention.

Primary goal:
- Generate a script the creator can film today.
- One video = one clear idea.
- Do not create five competing points.
- The script should feel like a real creator speaking, not a marketing assistant writing content.

Required short-form structure:
1. HOOK:
   - First 1-2 seconds.
   - Specific, direct, slightly provocative if appropriate.
   - Must create a reason to keep watching.

2. CONTEXT:
   - Explain what the video is about quickly.
   - Do not over-explain.

3. TENSION:
   - What is the problem, mistake, trade-off, surprise, risk, or useful observation?

4. VALUE / LESSON:
   - Give the viewer one clear takeaway.
   - Make it useful, personal, or educational.

5. PAYOFF:
   - Resolve the hook.
   - Make the viewer feel the video had a point.

6. CTA:
   - Soft, natural, and relevant.
   - Avoid desperate engagement bait.
   - Good examples:
     - "I'm documenting the whole build."
     - "Follow if you're building around a full-time job too."
     - "I'll update this after the next market close."
     - "I'm tracking the full portfolio journey here."

Retention rules:
- Every 5-8 seconds, something should change: shot, angle, subtitle, visual, example, tension, or pacing.
- Use short sentences.
- Avoid long setup.
- Avoid rambling.
- Make the middle of the script earn its place.
- If a line does not add tension, clarity, proof, personality, or payoff, remove it.
- Prefer one memorable point over several shallow points.

Script formatting:
- Make scripts easy for ScriptAI to sort later into production blocks.
- Use clear labels:
  [TITLE]
  [HOOK]
  [SPEECH]
  [VOICEOVER]
  [SHOT]
  [SUBTITLE]
  [TRANSITION]
  [DIRECTION]
  [CTA]
  [CAPTION]
  [NOTES]
- Use ;;; sparingly for intentional pauses in spoken lines.
- Do not overload the script with too many shot directions.
- Do not repeat the same spoken line in subtitles unless it is useful as short on-screen emphasis.

Length guidance:
- short = 15-30 seconds, roughly 45-80 spoken words.
- medium = 30-60 seconds, roughly 80-150 spoken words.
- long = 60-120 seconds, roughly 150-280 spoken words.
- If the requested length conflicts with the idea, simplify the idea rather than bloating the script.

Filmability rules:
- Include B-roll that one creator can realistically film alone.
- No screen recordings unless explicitly requested.
- Replace screen recording ideas with filmed phone/laptop/iPad shots.
- Use realistic shots:
  - face-to-camera
  - desk setup
  - typing
  - Xcode blurred on laptop
  - the creator's product on a phone
  - finance apps filmed with sensitive details hidden
  - walking shot
  - car clip
  - coffee/desk reset
  - phone close-up
  - over-shoulder laptop shot

Quality bar:
Before finalising, internally check:
- Is the first line actually interesting?
- Is the video about one clear idea?
- Is there a real tension or reason to keep watching?
- Does the viewer get a clear payoff?
- Does it sound like the creator context, not a generic marketing assistant?
- Can it be filmed today?
`;

const PILLAR_RULES = `
Pillar rules:

1. Investing / markets / finance:
- Never invent current prices, returns, market news, earnings, analyst ratings, portfolio values, or percentage moves unless supplied by the user.
- Do not tell viewers to buy, sell, hold, copy, avoid, or follow trades.
- Frame finance content as:
  - personal portfolio reflection
  - beginner lesson
  - risk observation
  - market diary
  - educational explanation
  - mistake or decision review
  - watchlist thinking
- Always include a not-financial-advice reminder as either:
  - a short spoken line
  - on-screen text
  - or a production note.
- Use accessible language.
- Avoid finance-bro phrasing.
- Avoid fake certainty:
  - "This will explode"
  - "Guaranteed"
  - "Easy money"
  - "You need to buy this"
  - "This is the next Nvidia"
- Strong finance angles include:
  - "what moved my portfolio today"
  - "winner, loser, lesson"
  - "the risk I did not notice"
  - "why a green day can still be misleading"
  - "one thing I'm watching tomorrow"
  - "what I learned as a beginner investor"
  - "how I think about risk while building income"

2. Dev / app-building:
- Make the script specific to the product, tools, design decision, bug, release, or trade-off supplied by the user.
- Avoid generic coding advice unless requested.
- Show the real trade-off:
  - speed vs quality
  - simple UI vs powerful feature
  - shipping vs perfection
  - AI help vs understanding the code
  - app idea vs actual product
  - motivation vs consistency after work
- Strong dev angles include:
  - "what I fixed today"
  - "the bug that wasted my evening"
  - "the feature that looked simple but wasn't"
  - "why I changed this design"
  - "building an app after work"
  - "what AI helped with and what it got wrong"
  - "the unglamorous part of indie app building"

3. Builder mindset crossover:
- If combining finance and dev, make the link explicit.
- Good crossover themes:
  - building software and building wealth both reward consistency
  - risk management applies to apps and investing
  - small improvements compound
  - working full time limits time, so systems matter
  - leverage comes from code, content, capital, and audience
- Do not make it sound like a fake motivational speech.
- Keep it grounded in facts the creator supplied.
`;

const NEGATIVE_PATTERNS = `
Avoid these weak patterns:
- Generic advice with no personal angle.
- Motivational filler.
- Overly polished LinkedIn-style phrasing.
- Fake urgency.
- Empty hooks.
- Too many points in one video.
- Long intro before the point.
- "In today's video..."
- "Welcome back..."
- "Make sure to like and follow..." as the main CTA.
- American hype language like:
  - bro
  - insane
  - crazy
  - game changer
  - absolutely wild
  - nobody is talking about this
  - this will change your life
- Claims that sound certain when the topic is uncertain.
- Finance content that sounds like stock picking.
- Dev content that sounds like a generic tutorial unless requested.
`;

const SORTING_CONTEXT = `
ScriptAI sorting context:
- Content is short-form vertical video for TikTok, Instagram Reels, YouTube Shorts, and X.
- The goal is to turn the creator's raw script into practical production blocks they can film and edit.
- Preserve any named products, tools, projects, audience details, and voice from the supplied script or creator context.
- Do not add personal facts that were not supplied.

Visual style:
- No screen recordings unless explicitly required.
- Convert implied screen recordings into filmed phone/laptop/iPad B-roll.
- Use practical visuals:
  - face-to-camera
  - desk setup
  - laptop/iPad/phone close-up
  - Xcode blurred in background
  - the creator's product on a phone
  - finance apps filmed with private details hidden
  - walking/car clips
  - typing shots
  - over-shoulder setup
  - simple product close-ups

Common filming modes:
1. Cinematic indoor Canon + DJI Mic Mini.
2. Casual iPhone + DJI Mic Mini anywhere.

Standard transitions:
- HARD CUT
- PUSH IN
- PULL OUT
- OVERHEAD SHOT
- WHOOSH CUT
- TRACKING SHOT
- WHIP PAN
- PHONE THROW TRANSITION
- CUTAWAY
- GOLDEN REVEAL

Sorting goal:
- Preserve the creative intent.
- Make the blocks clean, short, and useful.
- Remove duplicate planning sections if they repeat the same information.
- Spoken words go only in spoken.
- Visual/editing instructions go only in desc.
`;

export function buildGenerateScriptPrompt({
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
}) {
  return `${CREATOR_CONTEXT}

${HOOK_ENGINE}

${SCRIPT_SYSTEM}

${PILLAR_RULES}

${NEGATIVE_PATTERNS}

Generate a creator script for ScriptAI, a short-form script workspace.

Return JSON only, with this exact shape:
{
  "title": "short punchy script name",
  "script": "full raw creator script with clear sections, spoken lines, shot ideas, transitions, captions, CTA, and notes"
}

Request context:
- Platforms: ${platforms || "general social video"}.
- Creator context: ${creatorContext || "No additional creator context supplied. Do not invent personal facts."}.
- Length: ${length === "short" ? "15-30 seconds" : length === "long" ? "60-120 seconds" : "30-60 seconds"}.
- Tone: ${tone}.
- Format: ${format}.
- Brainstorm mode: ${brainstorm ? "include 3-5 concise concept options before the chosen script" : "write the strongest complete script directly"}.
- Current script name, if any: ${currentName || "none"}.
- Current draft, if any: ${currentScript || "none"}.
- Mode: ${mode === "custom" ? "custom follows the user instructions closely" : "auto chooses a strong concept from the supplied brief and creator context"}.
- User instructions: ${instructions || "Choose a strong original concept."}

Creative rules:
- Choose one clear angle.
- Start with the strongest hook.
- The first spoken line must be specific, short, and attention-worthy.
- Create tension early.
- Make the middle useful, personal, or educational.
- End with a payoff that resolves the hook.
- Use a soft CTA that fits the video.
- Avoid generic creator cliches.
- Avoid bloated explanations.
- Avoid fake certainty.
- Avoid making the creator sound like a guru.
- Make it sound like a real person documenting, learning, building, teaching, or reflecting honestly.

Output quality:
- Make the title specific, searchable, and under 80 characters.
- Match the requested length.
- Spoken sections should be tight and filmable.
- Include direct-to-camera speech when the format is talking-head or talking to camera.
- Include practical shot ideas, transition labels, on-screen text, caption, CTA, and notes/reminders where useful.
- Use UK spelling unless the creator context requests another language or locale.
- No markdown fences.
- Do not include anything outside the JSON object.

Finance safety:
- If the topic is finance, investing, markets, crypto, stocks, ETFs, portfolio updates, or money:
  - Do not invent current data.
  - Do not give buy/sell advice.
  - Include a not-financial-advice reminder.
  - Add a verify-before-filming note if the script depends on current data.

Dev safety:
- If the topic is app-building, preserve the named product, tools, constraints, and real trade-offs supplied by the user.
- Do not imply screen recordings unless explicitly requested. Use filmed device/laptop shots instead.

Before returning the JSON, silently improve the script by checking:
1. Is the hook specific enough?
2. Is the idea focused on one point?
3. Is there tension before the lesson?
4. Is the payoff clear?
5. Can the creator film this today?
6. Does it avoid fake hype?
7. Does it sound natural in the creator's preferred language and voice?
8. Is finance content safe and non-advisory?
9. Is the script the correct length?
10. Would a stranger understand why they should keep watching?`;
}

export function buildSortScriptPrompt({
  autoShots,
  creativity,
  creatorContext,
  customTypes,
  rawScript,
  tone,
}) {
  return `${SORTING_CONTEXT}

Creator context supplied by the user:
${creatorContext || "None. Preserve only facts present in the raw script."}

Sort this creator script into ScriptAI production blocks.

Return JSON only, with:
{
  "title": "short script title",
  "blocks": [
    {
      "type": "shot | transition | subtitle | voiceover | speech | direction${customTypes.length ? " | " + customTypes.map((t) => t.id).join(" | ") : " | custom types"}",
      "shotName": "short label, or empty string",
      "desc": "visual/action/editing description, or empty string",
      "spoken": "spoken caption/voiceover text, or empty string"
    }
  ]
}

Block rules:
- Preferred tone: ${tone}.
- Creativity level: ${creativity}/100.
- Auto shots ${autoShots ? "on: actively infer practical shot blocks when source implies visuals" : "off: only create shot blocks when source explicitly describes visuals"}.
- Preserve the original order and intent.
- Keep each block short and practical.
- Merge duplicated full-script and shot-list content.
- Do not create duplicate spoken lines.
- Spoken words only go in spoken.
- Visual, camera, action, editing, and filming instructions only go in desc.

Type rules:
- Use speech for direct-to-camera spoken lines.
- Use voiceover for narration over B-roll.
- Use shot for camera setup, scene, B-roll, app/product shot, desk shot, filmed device screen, props, or visual beat.
- Use subtitle for on-screen text, captions, lower-thirds, title cards, disclaimers, or overlays.
- Use transition for edit moves, preferring standard transition names.
- Use direction for notes, reminders, pacing, props, lighting/audio, source reminders, compliance reminders, or anything not spoken/shown directly.
- Custom types may be used only when they are clearly the best fit.

Content-specific rules:
- Finance scripts must include a not-financial-advice reminder if missing.
- Finance scripts must not become buy/sell recommendations.
- Unsourced current prices, returns, news, earnings, portfolio values, or market events should become a verify-before-filming direction.
- Dev scripts must preserve the named product, tools, and constraints where present.
- Convert screen recording suggestions into filmed phone/laptop/iPad B-roll unless screen recording is explicitly required.

ShotName examples:
- Hook
- Context
- Desk B-roll
- Phone Close-Up
- Laptop Shot
- Product Demo
- Portfolio B-roll
- Lesson
- CTA
- Disclaimer
- Verify Note

Do not add markdown.
Do not include anything outside the JSON object.

Script:
${rawScript}`;
}
