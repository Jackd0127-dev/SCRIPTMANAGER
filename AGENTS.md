# Agent Instructions

These instructions apply to the whole `SCRIPTMANAGER` repository.

## Project Shape

- This is a static HTML app with Vercel serverless API handlers in `api/`.
- Keep page markup in the root HTML files.
- Keep CSS in `assets/css/` and browser JavaScript in `assets/js/`.
- Shared serverless API helpers live in `api/lib/`.

## Commands

- Run `npm run check` before committing.
- For local browser testing, serve the repository root with any static server and open `index.html` or `scriptai.html`.
- API routes require `GEMINI_API_KEY` in the deployment environment and a verified Firebase ID token from an allowed ScriptAI origin.

## Editing Rules

- Do not put new inline `<style>` or inline `<script>` blocks in HTML pages.
- Do not commit `.DS_Store`, generated output, logs, or dependency folders.
- Do not hardcode private API keys, raw passwords, or personal secrets.
- Keep Gemini prompt changes scoped and user-neutral. Creator-specific context must come from the signed-in user's own settings, never hardcoded repository copy.
- The Firebase client config in `assets/js/director-auth.js` is public client configuration; do not treat it as a server secret.

## Verification

- Run syntax checks with `npm run check`.
- For visual changes, smoke test the affected page in a browser at desktop and mobile widths.
- For API changes, check both request validation and Gemini error handling paths.
