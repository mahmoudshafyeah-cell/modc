export async function sendEmailNotification(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'ModC <noreply@modc.store>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('فشل إرسال البريد الإلكتروني:', error);
  }
}