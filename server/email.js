// ============================================================
// Email sender
// ------------------------------------------------------------
// Wraps Resend. If RESEND_API_KEY isn't set, logs the email
// to the server console instead of sending it — so you can
// develop without an email provider.
//
// To enable in production:
//   1. Sign up at resend.com (free tier: 3,000 emails/month)
//   2. Verify your sending domain
//   3. Add RESEND_API_KEY and EMAIL_FROM to Render's env vars
// ============================================================

const FROM = process.env.EMAIL_FROM || "DameCooper Institute <noreply@damecooperinstitute.com>";

async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n[email] ─────────────────────────────────────────");
    console.log("[email] Provider not configured (RESEND_API_KEY not set)");
    console.log("[email] To:", to);
    console.log("[email] Subject:", subject);
    console.log("[email] Body (text):", text || "(html only)");
    console.log("[email] ─────────────────────────────────────────\n");
    return { queued: false, reason: "no_provider" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error("Email send failed: " + (data.message || res.statusText));
  }

  return await res.json();
}

module.exports = { sendEmail };