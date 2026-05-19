# SCRIPTMANAGER

Static tools for ScriptAI content planning and reference pages.

## Pages

- `index.html` - private launcher for the project pages.
- `scriptai.html` - Director, the script planning workspace.
- `ni-rewire-guide.html` - Northern Ireland house rewire guide.

## Structure

- `assets/css/` - page styles split out from the HTML files.
- `assets/js/` - browser scripts split out from the HTML files.
- `api/` - Vercel serverless handlers for Gemini script generation and sorting.
- `api/lib/` - shared API helpers.
- `scripts/` - repository validation scripts.
- `AGENTS.md` - instructions future AI agents should follow in this repo.

## Setup

Set `GEMINI_API_KEY` in the Vercel environment before using the AI features.

Run the local checks:

```bash
npm run check
```

To preview the static pages locally, serve the repository root with a static file server and open one of the HTML files.
