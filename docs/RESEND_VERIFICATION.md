# Resend verification email

Existing sign-up and resend actions now use `/api/verification-email` and the published `scriptai-email-verification` alias. Resend owns sender, Reply-To, subject, branding and content. The application supplies the current Firebase account's recipient and its server-generated ACTION_URL only. Publish future template edits without redeploying the app.

Configure server-only sensitive `NOVAS_RESEND_API_KEY` before release. Existing Firebase Admin credentials are reused. The endpoint uses the existing exact-origin policy, bounded strict input, revocation-checked Firebase identity, current user lookup, and persistent UID/email/IP/daily budgets. Recipient addresses and action links cannot be supplied by the browser. Failed requests have no SDK fallback. Provider bodies, credentials and action codes are not logged. The existing Firebase-hosted action handler and default continuation remain.

No reset, welcome or script-review email triggers were added; those remain Reserve. The shared signed Access webhook records provider delivery. Local API/security and project checks do not establish inbox rendering, sign-up completion or verification-link acceptance; record live evidence separately. Never send a pending customer queue to test delivery.
