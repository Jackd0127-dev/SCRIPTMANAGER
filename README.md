# SCRIPTMANAGER

Static tools for ScriptAI content planning and reference pages.

## Pages

- `index.html` - private launcher for the project pages.
- `scriptai.html` - the signed-in ScriptAI planning workspace.

## Structure

- `assets/css/` - page styles split out from the HTML files.
- `assets/js/` - browser scripts split out from the HTML files.
- `api/` - Vercel serverless handlers for Gemini script generation and sorting.
- `server/` - shared server-only helpers kept outside `/api` so Vercel does not deploy them as standalone functions.
- `scripts/` - repository validation scripts.
- `AGENTS.md` - instructions future AI agents should follow in this repo.

## Setup

Set `GEMINI_API_KEY` in the Vercel environment before using the AI features. Generation and sorting requests require a verified Firebase ID token and an allowed same-origin browser request.

Content Tracker opens ScriptAI with `?connect=novas-flow&origin=<exact-origin>&content=<content-id>`. Once the signed-in workspace is ready, the two tabs exchange a bounded, exact-origin `postMessage` handshake. A new legacy unstructured payload is preserved as one review-required Direction note; it is not labelled shoot-ready, its social caption is never converted to an in-video Subtitle, and its whole script is never flattened into one Speech block. Reconnecting an existing script changes only the verified backlink and preserves every API-managed and user-created block. ScriptAI saves and opens the record, then returns only the opaque script ID and title. Content text is never placed in the URL. Exact script links use `?script=<script-id>` and are resolved only after ScriptAI has loaded the signed-in user's own workspace.

The production root redirects to `scriptai.html`, so `https://scriptai.space` remains the canonical public app URL. The legacy launcher is still available explicitly at `index.html`.

Run the local checks:

```bash
npm run check
```

To preview the static pages locally, serve the repository root with a static file server and open `index.html` or `scriptai.html`.

## Creator-planning server integration

ScriptAI also supports a feature-flagged, owner-scoped server path for Content Tracker. It is separate from the browser handshake and has no social-provider publishing capability.

Set `CREATOR_PLANNING_AUTOMATION_ENABLED=true` only in an authorised environment. Production uses Firebase Admin and Firestore. Local tests may set `SCRIPTAI_AUTOMATION_BACKEND=memory`; production rejects that backend. Firebase Admin uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, or application-default credentials in the intended Google environment.

Browser API requests accept only exact trusted origins. The canonical ScriptAI origins, the exact production deployment, and the exact local port 3000 origins are built in; add any separately authorised preview or local origin with the comma-separated `SCRIPTAI_TRUSTED_ORIGINS` environment variable. Wildcard or similarly prefixed Vercel hosts are never trusted.

A signed-in owner creates or revokes a one-time token in Settings → Integrations. Only its SHA-256 digest is stored. Content Tracker uses that token server-side to upsert draft scripts transactionally. Stable automation/block keys, source hashes, record versions, and exact backlinks make retries converge and surface manual-edit or link conflicts. User-created blocks and unrelated workspace fields are preserved.

The flag-off rollback is non-destructive: revoke tokens and disable the flag; do not delete existing scripts or links. The coordinated Content Tracker documentation covers setup, rotation, dry-run remediation, and production verification.
