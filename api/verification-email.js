import { scriptAiAdminAuth, scriptAiAdminFirestore } from "../server/firebase-admin.js";
import { createVerificationEmailHandler } from "../server/verification-email.js";

export default createVerificationEmailHandler({
  getAuth: scriptAiAdminAuth,
  getDb: scriptAiAdminFirestore,
  getApiKey: () => process.env.NOVAS_RESEND_API_KEY?.trim(),
});
