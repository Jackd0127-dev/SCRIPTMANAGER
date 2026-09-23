# Novas staff login

Release candidate, 23 September 2026. Staff activation remains off pending owner-link acceptance.

The existing customer Firebase flow remains available. Novas staff use a separate server session linked to an already verified ScriptAI UID and an existing workspace. Email matching never creates or links an account.

## Connection

1. ScriptAI creates a signed HttpOnly state/PKCE cookie and redirects to the fixed Access authorization endpoint.
2. Access checks the current Firebase staff session, exact verified ScriptAI mapping and active creator/admin grant. It issues a hashed, single-use 60-second code, bound to the current central session and grant versions.
3. ScriptAI exchanges that code server-to-server using a separate credential and browser-bound verifier. Its Secure, HttpOnly, SameSite=Lax host cookie contains an opaque session token. No ScriptAI Firebase custom token is issued.
4. Every staff workspace read/save and generation request rechecks central access and the existing local Firebase user. Workspace writes use Firestore update-time preconditions with nanosecond precision. Revocation denies subsequent requests; concurrent changes return a conflict and preserve the draft.
5. Staff logout revokes the central parent session before clearing the local cookie. An unavailable revocation service reports failure. The page polls access while open and returns to sign-in after expiry. A failed staff handoff does not silently select a remembered customer account.

Existing Firebase customers retain their current Firestore rules. Staff workspace operations are server-only, so no new browser Firebase credential can outlive central revocation. Existing automation-token creation continues to require native Firebase proof and is not authorized by the staff cookie.

## Rollout prerequisites

Keep `SCRIPTAI_STAFF_LOGIN_ENABLED=false` and `CENTRAL_IDENTITY_MODE=off` until a reviewed rollout. Access requires its staff-mode flag, `ACCESS_SCRIPTAI_STAFF_ENABLED`, migrations 0003 and 0004, and the exact existing owner links and grants. Access and ScriptAI require the same independently generated, server-only `STAFF_SCRIPTAI_INTROSPECTION_SECRET`. ScriptAI also requires its own existing Firebase Admin runtime credentials, never CRM data credentials.

The per-product secret is saved in production on Access and ScriptAI. Existing ScriptAI Firebase runtime credentials are present. Access migrations are applied. Hosted owner-link acceptance, activation and sign-in/out checks remain outstanding. No credentials, account mappings, grants, Firestore rules or deployments were changed by this implementation. Disable the flags to roll back; preserve mappings and workspace data.

## Evidence

`npm run check` passes 34 tests, including browser-state mismatch, exact audience/UID, disabled users, missing workspace, stale and concurrent writes, revoked generation, invalid customer authorization, and logout outage. Access passes 72 tests plus lint, typecheck, migration consistency and production build. Desktop and 390 x 844 sign-in layout and expired staff recovery were checked in a local browser with synthetic endpoint responses. This does not prove a hosted sign-in or live provider acceptance.
