/**
 * Email Notification Helper
 *
 * This module handles outbound email notifications to applicants.
 * Currently logs email content and uses the built-in notification system.
 *
 * To enable real email delivery, set the following environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * and install nodemailer: pnpm add nodemailer @types/nodemailer
 *
 * Then replace the `sendEmailFallback` function below with actual SMTP logic.
 */

export type EmailPayload = {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
};

/**
 * Sends an email notification to an applicant.
 * Falls back to console logging if SMTP is not configured.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? "careers@marriotbonvoy-copenhagen.com";

  if (smtpHost && smtpUser && smtpPass) {
    // SMTP is configured — use nodemailer (install separately)
    try {
      // Dynamic import to avoid breaking the app if nodemailer is not installed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodemailer: any = await import("nodemailer" as string).catch(() => null);
      if (!nodemailer) {
        console.warn("[Email] nodemailer not installed. Run: pnpm add nodemailer");
        return false;
      }
      const transporter = nodemailer.default?.createTransport
        ? nodemailer.default.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT ?? "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: smtpUser, pass: smtpPass },
      })
        : nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT ?? "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: `"Marriot Bonvoy Copenhagen Careers" <${smtpFrom}>`,
        to: payload.toName ? `"${payload.toName}" <${payload.to}>` : payload.to,
        subject: payload.subject,
        text: payload.textBody,
        html: payload.htmlBody,
      });
      console.log(`[Email] Sent to ${payload.to}: ${payload.subject}`);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send email:", error);
      return false;
    }
  } else {
    // SMTP not configured — log the email content for debugging
    console.log(`[Email] (SMTP not configured) Would send to ${payload.to}:`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Body: ${payload.textBody.substring(0, 200)}...`);
    return false;
  }
}

// ─── Email template builders ──────────────────────────────────────────────────

export function buildStatusChangeEmail(params: {
  applicantName: string;
  applicantEmail: string;
  status: string;
  adminNotes?: string;
  applicationId: number;
}): EmailPayload {
  const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    interview_scheduled: "Interview Scheduled",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  const label = statusLabels[params.status] ?? params.status;

  const textBody = `
Dear ${params.applicantName},

Your application status has been updated to: ${label}

${params.adminNotes ? `Message from the recruitment team:\n${params.adminNotes}\n` : ""}

You can view your application details and track your progress at:
https://marriotbonvoy-copenhagen.manus.space/application/${params.applicationId}

Best regards,
Marriot Bonvoy Copenhagen Recruitment Team
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1a2e1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a3a1a, #2d5a2d); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">Marriot Bonvoy Copenhagen</h1>
    <p style="color: #e8f0e8; margin: 8px 0 0;">Recruitment Portal</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #d4e0d4; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a3a1a;">Application Status Update</h2>
    <p>Dear <strong>${params.applicantName}</strong>,</p>
    <p>Your application status has been updated to:</p>
    <div style="background: #f0f7f0; border-left: 4px solid #2d5a2d; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="font-size: 18px; color: #2d5a2d;">${label}</strong>
    </div>
    ${params.adminNotes ? `
    <div style="background: #faf7f0; border-left: 4px solid #c9a84c; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #5a4a1a;">"${params.adminNotes}"</p>
      <small style="color: #8a7a4a;">— Recruitment Team</small>
    </div>
    ` : ""}
    <p>
      <a href="https://marriotbonvoy-copenhagen.manus.space/application/${params.applicationId}"
         style="background: #2d5a2d; color: #fff; padding: 12px 24px; border-radius: 25px; text-decoration: none; display: inline-block; margin-top: 10px;">
        View Application
      </a>
    </p>
    <hr style="border: none; border-top: 1px solid #e0e8e0; margin: 30px 0;">
    <p style="font-size: 12px; color: #888;">Marriot Bonvoy Copenhagen · Careers Team · Copenhagen, Denmark</p>
  </div>
</body>
</html>
`.trim();

  return {
    to: params.applicantEmail,
    toName: params.applicantName,
    subject: `Application Update: ${label} – Marriot Bonvoy Copenhagen`,
    htmlBody,
    textBody,
  };
}

export function buildNewMessageEmail(params: {
  applicantName: string;
  applicantEmail: string;
  messagePreview: string;
  applicationId: number;
}): EmailPayload {
  const textBody = `
Dear ${params.applicantName},

You have a new message from the Marriot Bonvoy Copenhagen Recruitment Team regarding your application.

Message preview:
"${params.messagePreview.substring(0, 300)}${params.messagePreview.length > 300 ? "..." : ""}"

To reply, visit:
https://marriotbonvoy-copenhagen.manus.space/application/${params.applicationId}

Best regards,
Marriot Bonvoy Copenhagen Recruitment Team
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1a2e1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a3a1a, #2d5a2d); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #c9a84c; margin: 0; font-size: 24px;">Marriot Bonvoy Copenhagen</h1>
    <p style="color: #e8f0e8; margin: 8px 0 0;">Recruitment Portal</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #d4e0d4; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1a3a1a;">New Message from the Recruitment Team</h2>
    <p>Dear <strong>${params.applicantName}</strong>,</p>
    <p>You have a new message regarding your application:</p>
    <div style="background: #f0f7f0; border-left: 4px solid #2d5a2d; padding: 15px; margin: 20px 0; border-radius: 4px; font-style: italic;">
      "${params.messagePreview.substring(0, 300)}${params.messagePreview.length > 300 ? "..." : ""}"
    </div>
    <p>
      <a href="https://marriotbonvoy-copenhagen.manus.space/application/${params.applicationId}"
         style="background: #c9a84c; color: #1a2e1a; padding: 12px 24px; border-radius: 25px; text-decoration: none; display: inline-block; margin-top: 10px; font-weight: bold;">
        Reply to Message
      </a>
    </p>
    <hr style="border: none; border-top: 1px solid #e0e8e0; margin: 30px 0;">
    <p style="font-size: 12px; color: #888;">Marriot Bonvoy Copenhagen · Careers Team · Copenhagen, Denmark</p>
  </div>
</body>
</html>
`.trim();

  return {
    to: params.applicantEmail,
    toName: params.applicantName,
    subject: `New Message from Recruitment Team – Marriot Bonvoy Copenhagen`,
    htmlBody,
    textBody,
  };
}
