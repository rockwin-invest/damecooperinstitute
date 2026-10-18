// ============================================================
// Email sender
// ------------------------------------------------------------
// Wraps Resend. If RESEND_API_KEY isn't set, logs the email
// to the server console instead of sending it — so you can
// develop without an email provider.
//
// Exports:
//   sendEmail             — core sender
//   sendLoginAlert        — new sign-in notification
//   sendPasswordChanged   — confirmation after change-password
//   sendPasswordReset     — forgot-password reset link
//   sendInvitation        — new-user invitation link
// ============================================================

const FROM =
  process.env.EMAIL_FROM ||
  "DameCooper Institute <noreply@damecooperinstitute.com>";

// ------------------------------------------------------------
// Core sender
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Every user-supplied value that lands inside an HTML body
// must go through esc() — blocks HTML injection via names,
// user-agents, etc.
// ------------------------------------------------------------
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ------------------------------------------------------------
// Login alert
// ------------------------------------------------------------
async function sendLoginAlert({ user, ip, userAgent, when }) {
  if (!user || !user.email) {
    console.warn("[email] sendLoginAlert: no user.email — skipped");
    return { ok: false, reason: "no_recipient" };
  }

  const name = user.firstName || "there";
  const whenStr = (when instanceof Date ? when : new Date(when || Date.now())).toUTCString();
  const ipStr = ip || "unknown";
  const uaStr = userAgent || "unknown";

  const subject = "New sign-in to your DameCooper account";

  const text =
`Hello ${name},

We noticed a new sign-in to your DameCooper Institute account.

Time:    ${whenStr}
IP:      ${ipStr}
Device:  ${uaStr}

If this was you, you can ignore this email.
If you don't recognise this activity, reset your password immediately
and contact the administrator.

— DameCooper Institute`;

  const html =
`<p>Hello ${esc(name)},</p>
<p>We noticed a new sign-in to your DameCooper Institute account.</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td><strong>Time</strong></td><td>${esc(whenStr)}</td></tr>
  <tr><td><strong>IP</strong></td><td>${esc(ipStr)}</td></tr>
  <tr><td><strong>Device</strong></td><td>${esc(uaStr)}</td></tr>
</table>
<p>If this was you, you can ignore this email.<br>
If you don't recognise this activity, reset your password immediately
and contact the administrator.</p>
<p style="color:#66717d;font-size:13px;">— DameCooper Institute</p>`;

  try {
    return await sendEmail({ to: user.email, subject, html, text });
  } catch (err) {
    // Login alerts must never break the login flow.
    console.error("[email] login alert failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ------------------------------------------------------------
// Password changed (user-initiated)
// ------------------------------------------------------------
async function sendPasswordChanged({ user, ip, when }) {
  if (!user || !user.email) return { ok: false, reason: "no_recipient" };

  const name = user.firstName || "there";
  const whenStr = (when instanceof Date ? when : new Date(when || Date.now())).toUTCString();
  const ipStr = ip || "unknown";

  const subject = "Your DameCooper password was changed";

  const text =
`Hello ${name},

The password for your DameCooper Institute account was just changed.

Time: ${whenStr}
IP:   ${ipStr}

If you made this change, no action is needed.
If you did NOT make this change, contact the administrator immediately.

— DameCooper Institute`;

  const html =
`<p>Hello ${esc(name)},</p>
<p>The password for your DameCooper Institute account was just changed.</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td><strong>Time</strong></td><td>${esc(whenStr)}</td></tr>
  <tr><td><strong>IP</strong></td><td>${esc(ipStr)}</td></tr>
</table>
<p>If you made this change, no action is needed.<br>
If you did <strong>not</strong> make this change, contact the administrator immediately.</p>
<p style="color:#66717d;font-size:13px;">— DameCooper Institute</p>`;

  try {
    return await sendEmail({ to: user.email, subject, html, text });
  } catch (err) {
    console.error("[email] password-changed notification failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ------------------------------------------------------------
// Password reset
// ------------------------------------------------------------
async function sendPasswordReset({ user, resetUrl }) {
  if (!user || !user.email) return { ok: false, reason: "no_recipient" };
  if (!resetUrl) return { ok: false, reason: "no_url" };

  const name = user.firstName || "there";
  const subject = "Reset your DameCooper password";

  const text =
`Hello ${name},

Someone requested a password reset for your DameCooper account.

To choose a new password, open this link within the next hour:

${resetUrl}

If you didn't request this, you can ignore this email — your password will not change.

— DameCooper Institute`;

  const html =
`<p>Hello ${esc(name)},</p>
<p>Someone requested a password reset for your DameCooper account.</p>
<p><a href="${esc(resetUrl)}" style="background:#b69a59;color:#10243a;padding:12px 24px;text-decoration:none;border-radius:2px;font-weight:600;display:inline-block;">Choose a new password</a></p>
<p style="color:#66717d;font-size:13px;">Or open this URL directly:<br>${esc(resetUrl)}</p>
<p style="color:#66717d;font-size:13px;">This link expires in 1 hour. If you didn't request it, you can ignore this email.</p>
<p style="color:#66717d;font-size:13px;">— DameCooper Institute</p>`;

  try {
    return await sendEmail({ to: user.email, subject, html, text });
  } catch (err) {
    console.error("[email] password-reset send failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ------------------------------------------------------------
// Invitation
// ------------------------------------------------------------
async function sendInvitation({ invite, inviteUrl }) {
  if (!invite || !invite.email) return { ok: false, reason: "no_recipient" };
  if (!inviteUrl) return { ok: false, reason: "no_url" };

  const name = invite.firstName || "there";
  const roleRaw = String(invite.role || "").toLowerCase();
  const roleLabel = roleRaw ? roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1) : "member";
  const subject = "You've been invited to DameCooper Institute";

  const text =
`Hello ${name},

An account has been created for you at DameCooper Institute as a ${roleLabel}.

Your login ID is: ${invite.loginId}

To set your password and activate your account, open this link within 7 days:

${inviteUrl}

If you weren't expecting this, you can ignore this email.

— DameCooper Institute`;

  const html =
`<p>Hello ${esc(name)},</p>
<p>An account has been created for you at DameCooper Institute as a <strong>${esc(roleLabel)}</strong>.</p>
<p>Your login ID is: <code>${esc(invite.loginId)}</code></p>
<p><a href="${esc(inviteUrl)}" style="background:#b69a59;color:#10243a;padding:12px 24px;text-decoration:none;border-radius:2px;font-weight:600;display:inline-block;">Set your password</a></p>
<p style="color:#66717d;font-size:13px;">Or open this URL directly:<br>${esc(inviteUrl)}</p>
<p style="color:#66717d;font-size:13px;">This link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
<p style="color:#66717d;font-size:13px;">— DameCooper Institute</p>`;

  try {
    return await sendEmail({ to: invite.email, subject, html, text });
  } catch (err) {
    console.error("[email] invitation send failed:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  sendEmail,
  sendLoginAlert,
  sendPasswordChanged,
  sendPasswordReset,
  sendInvitation
};