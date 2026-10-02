/** Request verification for the signed-in Firebase identity; recipient and link are server-owned. */
export async function requestVerificationEmail(user, fetcher = fetch) {
  if (!user) throw new Error("Sign in before requesting verification.");
  const token = await user.getIdToken(true);
  const response = await fetcher("/api/verification-email", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "verify-email" }),
  });
  if (!response.ok) {
    throw Object.assign(new Error("Verification email could not be sent."), { code: response.status === 429 ? "auth/too-many-requests" : "auth/network-request-failed" });
  }
}
