export interface EmailEnv {
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
}

export async function sendOtpEmail(env: EmailEnv, toEmail: string, code: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: toEmail,
      subject: 'Your MIKPAL verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Verify your MIKPAL account</h2>
          <p style="color: #475569;">Enter this code to finish signing up. It expires in 10 minutes.</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #F26522; margin: 24px 0;">${code}</div>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[RESEND ERROR]', res.status, text);
    return false;
  }
  return true;
}
