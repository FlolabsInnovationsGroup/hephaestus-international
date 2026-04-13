const RESEND_API_BASE = 'https://api.resend.com/emails';

export async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.');

  const res = await fetch(RESEND_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
  }
}
