/**
 * Email delivery module.
 *
 * Sends emails via SMTP (nodemailer).  In development — or whenever the SMTP
 * environment variables are not set — the email is NOT sent; the reset link
 * is printed to the server console instead so engineers can test the flow
 * without configuring real mail credentials.
 *
 * Required env vars for real delivery:
 *   SMTP_HOST   — e.g. smtp.sendgrid.net
 *   SMTP_PORT   — e.g. 587
 *   SMTP_USER   — SMTP username / API key identifier
 *   SMTP_PASS   — SMTP password / API key secret
 *   SMTP_FROM   — From address, e.g. noreply@tamilkovil.com
 */

import nodemailer from "nodemailer";

function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

interface SendPasswordResetOptions {
  toEmail: string;
  firstName: string;
  resetUrl: string;
}

/**
 * Send a password-reset email.
 *
 * If SMTP is not configured the link is logged to the console (dev helper).
 * Either way the promise resolves without throwing so the route can respond
 * generically regardless of email outcome.
 */
export async function sendPasswordResetEmail({
  toEmail,
  firstName,
  resetUrl,
}: SendPasswordResetOptions): Promise<void> {
  const subject = "Reset your Tamil Kovil password";
  const text = [
    `Hello ${firstName},`,
    "",
    "We received a request to reset the password for your Tamil Kovil account.",
    "",
    "Click the link below to set a new password (valid for 1 hour):",
    resetUrl,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "Your password will not change unless you click the link above.",
    "",
    "— Tamil Kovil Team",
  ].join("\n");

  const html = `
<p>Hello ${firstName},</p>
<p>We received a request to reset the password for your Tamil Kovil account.</p>
<p>
  <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#e07b39;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
    Reset my password
  </a>
</p>
<p style="color:#666;font-size:13px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
<p style="color:#999;font-size:12px;">Tamil Kovil Temple Management</p>
`;

  if (!isSmtpConfigured()) {
    console.warn(
      "[email] SMTP not configured — password reset link (dev only):\n" +
        `  to:  ${toEmail}\n` +
        `  url: ${resetUrl}`,
    );
    return;
  }

  try {
    const transport = createTransport();
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.info(`[email] password reset email sent to ${toEmail}`);
  } catch (err) {
    // Log but don't rethrow — the route should still return the generic
    // "check your email" response so as not to leak whether delivery failed.
    console.error("[email] failed to send password reset email:", err);
  }
}
