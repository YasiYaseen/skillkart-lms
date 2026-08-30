import nodemailer from "nodemailer";

interface ActionButton {
  text: string;
  url: string;
}

let transporter: nodemailer.Transporter | null = null;

function getClientUrl(): string {
  return process.env.CLIENT_URL || "http://localhost:5173";
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  } else {
    // In dev / test, create ethereal test account or fallback transporter
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EMAIL SERVICE] Initialized Ethereal test mailer for ${testAccount.user}`);
    } catch {
      // Fallback JSON / log transport if offline
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

/**
 * Builds standard responsive SkillKart HTML email layout
 */
function buildEmailTemplate(
  title: string,
  preheader: string,
  bodyHtml: string,
  actionButton?: ActionButton
): string {
  const clientUrl = getClientUrl();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f9;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #0f172a;
      padding: 32px 36px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #3b82f6;
    }
    .content {
      padding: 36px 36px 28px 36px;
    }
    .headline {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }
    .subtitle {
      font-size: 15px;
      color: #64748b;
      margin: 0 0 24px 0;
    }
    .card {
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 20px;
      margin: 20px 0;
    }
    .button-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }
    .footer {
      background: #f8fafc;
      padding: 24px 36px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="${clientUrl}" class="logo">Skill<span>Kart</span> 🎓</a>
      </div>
      <div class="content">
        <h1 class="headline">${title}</h1>
        <p class="subtitle">${preheader}</p>
        ${bodyHtml}
        ${
          actionButton
            ? `
          <div class="button-container">
            <a href="${actionButton.url}" class="button" target="_blank">${actionButton.text}</a>
          </div>`
            : ""
        }
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} SkillKart LMS. All rights reserved.</p>
        <p>You received this email because of an action on your SkillKart account.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generic send email with safe non-blocking error handling
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const mailer = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"SkillKart LMS" <notifications@skillkart.local>';

    const info = await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log(`[EMAIL SERVICE] Email sent successfully to ${to}. MessageId: ${info.messageId}`);

    // If Ethereal test account is used, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL SERVICE] 📬 Email Preview URL: ${previewUrl}`);
    }

    return true;
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed to send email to ${to}:`, error);
    // Non-blocking: return false without throwing
    return false;
  }
}

/**
 * 1. Send Welcome Email upon user registration
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const clientUrl = getClientUrl();
  const title = `Welcome to SkillKart, ${userName}! 🎉`;
  const preheader = "Your journey to mastering new skills starts today.";

  const bodyHtml = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Welcome to SkillKart! We're thrilled to have you join our learning community. Explore courses taught by industry experts, track your study progress, earn verified certificates, and build real-world skills.</p>
    <div class="card">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">🚀 Quick Start Checklist:</p>
      <ul style="margin: 0; padding-left: 20px; color: #475569;">
        <li>Browse our catalog of curated courses</li>
        <li>Enroll in your first course and start watching lessons</li>
        <li>Take private study notes & bookmark key lessons in the Study Hub</li>
        <li>Pass quizzes and claim your verifiable completion certificates</li>
      </ul>
    </div>
  `;

  const html = buildEmailTemplate(title, preheader, bodyHtml, {
    text: "Explore Courses Now →",
    url: `${clientUrl}/courses`,
  });

  return sendEmail({
    to: userEmail,
    subject: "Welcome to SkillKart LMS! 🎓",
    html,
    text: `Hi ${userName}, welcome to SkillKart! Explore courses at ${clientUrl}/courses`,
  });
}

/**
 * 2. Send Course Enrollment Email
 */
export async function sendEnrollmentEmail(
  userEmail: string,
  userName: string,
  courseTitle: string,
  courseId: string
): Promise<boolean> {
  const clientUrl = getClientUrl();
  const title = "Enrollment Confirmed! 📚";
  const preheader = `You are now officially enrolled in "${courseTitle}".`;

  const bodyHtml = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Congratulations! You have successfully enrolled in <strong>${courseTitle}</strong>.</p>
    <div class="card">
      <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 16px;">Course Overview</h3>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Course: <strong>${courseTitle}</strong><br>
        Access: Lifetime access to all video lessons, resources, and quizzes.
      </p>
    </div>
    <p>Jump right in and start learning at your own pace whenever you're ready.</p>
  `;

  const html = buildEmailTemplate(title, preheader, bodyHtml, {
    text: "Start Learning Now →",
    url: `${clientUrl}/learn/${courseId}`,
  });

  return sendEmail({
    to: userEmail,
    subject: `Enrolled: ${courseTitle} 🎓`,
    html,
    text: `Hi ${userName}, you are now enrolled in ${courseTitle}. Start learning at ${clientUrl}/learn/${courseId}`,
  });
}

/**
 * 3. Send Certificate Issuance Email upon course completion
 */
export async function sendCertificateEmail(
  userEmail: string,
  userName: string,
  courseTitle: string,
  certificateId: string
): Promise<boolean> {
  const clientUrl = getClientUrl();
  const title = "Congratulations on Your Certificate! 🏆";
  const preheader = `You completed "${courseTitle}" and earned your official certificate.`;

  const bodyHtml = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Fantastic job! You have completed 100% of <strong>${courseTitle}</strong> and passed all required assessments.</p>
    <div class="card" style="text-align: center; border-color: #fde68a; background: #fefce8;">
      <span style="font-size: 32px;">🏅</span>
      <h3 style="margin: 8px 0 4px 0; color: #854d0e; font-size: 18px;">Certificate of Completion</h3>
      <p style="margin: 0; color: #a16207; font-size: 13px; font-family: monospace;">
        ID: <strong>${certificateId}</strong>
      </p>
    </div>
    <p>Your certificate is permanent and can be publicly verified by anyone using your unique certificate ID.</p>
  `;

  const html = buildEmailTemplate(title, preheader, bodyHtml, {
    text: "View Your Certificate →",
    url: `${clientUrl}/certificates/verify/${certificateId}`,
  });

  return sendEmail({
    to: userEmail,
    subject: `🏆 Certificate Awarded: ${courseTitle}`,
    html,
    text: `Hi ${userName}, congratulations on earning your certificate for ${courseTitle}! View it at ${clientUrl}/certificates/verify/${certificateId}`,
  });
}
