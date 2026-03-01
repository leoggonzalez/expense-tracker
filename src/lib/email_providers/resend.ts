const RESEND_API_URL = "https://api.resend.com/emails";

type ResendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendWithResend({
  to,
  subject,
  text,
}: ResendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Missing Resend email configuration");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${responseText}`);
  }
}
