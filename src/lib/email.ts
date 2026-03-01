import { LOGIN_CODE_TTL_MS } from "@/lib/auth";
import { sendWithResend } from "@/lib/email_providers/resend";
import { sendWithSmtp } from "@/lib/email_providers/smtp";

type SendLoginCodeEmailInput = {
  to: string;
  code: string;
};

function getExpiryMinutes(): number {
  return Math.round(LOGIN_CODE_TTL_MS / 60000);
}

function getProvider(): string {
  return process.env.EMAIL_PROVIDER || "resend";
}

export async function sendLoginCodeEmail({
  to,
  code,
}: SendLoginCodeEmailInput): Promise<void> {
  const subject = "Your login code";
  const text = [
    "Use the following code to sign in:",
    "",
    code,
    "",
    `This code expires in ${getExpiryMinutes()} minutes.`,
    "",
    "If you did not request this email, you can ignore it.",
  ].join("\n");

  switch (getProvider()) {
    case "resend":
      await sendWithResend({ to, subject, text });
      return;
    case "smtp":
      await sendWithSmtp({ to, subject, text });
      return;
    default:
      throw new Error(`Unsupported email provider: ${getProvider()}`);
  }
}
