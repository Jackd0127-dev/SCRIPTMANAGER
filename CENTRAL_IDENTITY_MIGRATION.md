# ScriptAI central identity migration

ScriptAI keeps Firebase authoritative while `CENTRAL_IDENTITY_MODE=off`.

In `dual` mode, `/api/central-link-proof` accepts only a current Firebase ID token with a recent sign-in and issues a five-minute proof containing the existing Firebase UID. Access verifies it against `/api/central-link-jwks` while separately requiring the person's Auth0 session. Email equality is never account-linking evidence.

Do not enable enforced mode or remove the existing Firebase entry path until workspace mapping, entitlement denial, revocation, recovery and rollback have passed outside production.

The HMAC-authenticated `/api/central-provisioning` route creates an idempotent shadow-account record. A proof-linked Firebase UID is reused when supplied. Otherwise the shadow record confers no workspace access until linking succeeds. Revoke locks the shadow account without deleting scripts or projects.
