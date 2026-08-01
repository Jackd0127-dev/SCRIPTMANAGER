# SCRIPTMANAGER

Static tools for ScriptAI content planning and reference pages.

## Pages

- `index.html` - private launcher for the project pages.
- `scriptai.html` - the signed-in ScriptAI planning workspace.

## Structure

- `assets/css/` - page styles split out from the HTML files.
- `assets/js/` - browser scripts split out from the HTML files.
- `api/` - Vercel serverless handlers for Gemini script generation and sorting.
- `api/lib/` - shared API helpers.
- `scripts/` - repository validation scripts.
- `AGENTS.md` - instructions future AI agents should follow in this repo.

## Setup

Set `GEMINI_API_KEY` in the Vercel environment before using the AI features. Generation and sorting requests require a verified Firebase ID token and an allowed same-origin browser request.

Content Tracker can open ScriptAI with `?connect=novas-flow&origin=<exact-origin>` to select the active script. Exact script links use `?script=<script-id>` and are resolved only after ScriptAI has loaded the signed-in user's own workspace.

The production root redirects to `scriptai.html`, so `https://scriptai.space` remains the canonical public app URL. The legacy launcher is still available explicitly at `index.html`.

Run the local checks:

```bash
npm run check
```

To preview the static pages locally, serve the repository root with a static file server and open `index.html` or `scriptai.html`.
