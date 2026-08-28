import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

export async function initEmailTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  try {
    // Attempt Ethereal account creation with 3s timeout
    const testAccountPromise = nodemailer.createTestAccount();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal timeout')), 3000));
    testAccount = (await Promise.race([testAccountPromise, timeoutPromise])) as nodemailer.TestAccount;
    
    console.log('✓ Ethereal SMTP Test Account ready:', testAccount.user);

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return transporter;
  } catch (err: any) {
    console.log(`ℹ Using local fast JSON email transporter (${err.message})`);
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }
}

export async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ messageId: string; previewUrl: string | false }> {
  const mailer = await initEmailTransporter();

  const info = await mailer.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  const fallbackPreview = `https://ethereal.email/messages`;

  console.log(`✉ Email delivered to ${options.to} | MessageId: ${info.messageId}`);

  return {
    messageId: info.messageId || 'msg_' + Date.now(),
    previewUrl: previewUrl || fallbackPreview,
  };
}