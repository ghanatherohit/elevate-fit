import { Resend } from "resend";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const sharedSender = "onboarding@resend.dev";

const getResendClient = () => {
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  if (!from) {
    return new Resend(apiKey);
  }
  return new Resend(apiKey);
};

export async function sendEmail(payload: EmailPayload) {
  const client = getResendClient();
  const sender =
    from && !from.endsWith("@gmail.com") && !from.endsWith("@googlemail.com")
      ? from
      : sharedSender;
  const result = await client.emails.send({
    from: sender,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  if ("error" in result && result.error) {
    throw new Error(result.error.message || "Resend delivery failed");
  }

  return result;
}
