import nodemailer from "nodemailer";

type SmtpEmailInput = {
  to: string;
  subject: string;
  text: string;
};

function getSmtpConfig() {
  const from = process.env.EMAIL_FROM;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const secure = process.env.SMTP_SECURE;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!from || !host || !port || !secure || !user || !pass) {
    throw new Error("Missing SMTP email configuration");
  }

  return {
    from,
    host,
    port: Number(port),
    secure: secure === "true",
    user,
    pass,
  };
}

export async function sendWithSmtp({
  to,
  subject,
  text,
}: SmtpEmailInput): Promise<void> {
  const config = getSmtpConfig();

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transport.sendMail({
    from: config.from,
    to,
    subject,
    text,
  });
}
