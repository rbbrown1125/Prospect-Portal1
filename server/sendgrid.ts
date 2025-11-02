import { MailService } from '@sendgrid/mail';

// TESTING ONLY: Hardcoded API key (REMOVE IN PRODUCTION)
const HARDCODED_SENDGRID_KEY = process.env.SENDGRID_API_KEY || '';

if (!HARDCODED_SENDGRID_KEY) {
  console.warn("SENDGRID_API_KEY not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (HARDCODED_SENDGRID_KEY) {
  mailService.setApiKey(HARDCODED_SENDGRID_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!HARDCODED_SENDGRID_KEY) {
    console.log(`[SENDGRID DISABLED] Would send email to ${params.to} with subject: ${params.subject}`);
    return true; // Return success for development
  }
  
  try {
    const mailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) {
      mailData.text = params.text;
    }
    
    if (params.html) {
      mailData.html = params.html;
    }
    
    await mailService.send(mailData);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const verificationUrl = `${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5000'}/verify-email/${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e293b; font-size: 28px; margin: 0;">Welcome to Infor CloudSuite Industrial Portal</h1>
        <p style="color: #64748b; font-size: 16px; margin-top: 10px;">by Godlan</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #1e293b; font-size: 22px; margin-top: 0;">Hi ${name}!</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering with us. To complete your account setup and access your personalized site, 
          please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; 
                    padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Verify Email & Set Password
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            If you can't click the button above, copy and paste this link into your browser:
          </p>
          <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin-top: 5px;">
            ${verificationUrl}
          </p>
        </div>
        
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            This verification link will expire in 24 hours. If you didn't request this account, you can safely ignore this email.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Questions? Contact us at <a href="mailto:support@godlan.com" style="color: #3b82f6;">support@godlan.com</a>
        </p>
      </div>
    </div>
  `;

  const textContent = `
    Welcome to Infor CloudSuite Industrial Portal by Godlan!
    
    Hi ${name},
    
    Thank you for registering with us. To complete your account setup and access your personalized site, 
    please verify your email address by visiting this link:
    
    ${verificationUrl}
    
    This verification link will expire in 24 hours. If you didn't request this account, you can safely ignore this email.
    
    Questions? Contact us at support@godlan.com
  `;

  return sendEmail({
    to: email,
    from: 'sam@sb3partners.com', // Verified sender in SendGrid account
    subject: 'Verify your email - Infor CloudSuite Industrial Portal',
    text: textContent,
    html: htmlContent,
  });
}