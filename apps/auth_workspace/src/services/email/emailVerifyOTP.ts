import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL,
    pass: process.env.SMTP_PASSWORD || process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

export const sendOTPVerificationEmail = async (
  email: string,
  otp: string,
  name: string = "User"
): Promise<boolean> => {
  const subject = "Verify Your Techspire Marketplace Account";

  // Professional HTML template with attractive UI
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      /* Modern CSS Reset */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; }
      
      /* Email Container */
      .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
      
      /* Header */
      .email-header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
      .logo { height: 40px; }
      .header-text { color: white; margin-top: 16px; font-size: 20px; font-weight: 600; }
      
      /* Content */
      .email-content { padding: 32px; }
      .greeting { font-size: 18px; margin-bottom: 16px; }
      .message { margin-bottom: 24px; color: #4b5563; }
      
      /* OTP Box */
      .otp-container { background: #f9fafb; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; border: 1px dashed #d1d5db; }
      .otp-code { font-size: 32px; letter-spacing: 8px; color: #4f46e5; font-weight: 700; margin: 12px 0; font-family: monospace; }
      .otp-expiry { color: #6b7280; font-size: 14px; }
      
      /* Footer */
      .email-footer { padding: 24px; text-align: center; background: #f9fafb; color: #6b7280; font-size: 14px; }
      .footer-link { color: #4f46e5; text-decoration: none; }
      .social-icons { margin-top: 16px; }
      .social-icon { display: inline-block; margin: 0 8px; }
      
      /* Responsive */
      @media (max-width: 480px) {
        .email-content { padding: 24px; }
        .otp-code { font-size: 24px; letter-spacing: 4px; }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <img src="https://i.postimg.cc/ZRYTCfsn/techspire-logo.png" alt="Techspire Marketplace" class="logo">
        <div class="header-text">Campus Commerce Redefined</div>
      </div>
      
      <div class="email-content">
        <p class="greeting">Hello ${name},</p>
        <p class="message">Welcome to Techspire Marketplace! Please verify your email address to complete your registration and start exploring campus innovations.</p>
        
        <div class="otp-container">
          <p>Your verification code is:</p>
          <div class="otp-code">${otp}</div>
          <p class="otp-expiry">This code will expire in 5 minutes.</p>
        </div>
        
        <p class="message">If you didn't request this code, please ignore this email or contact our support team for assistance.</p>
      </div>
      
      <div class="email-footer">
        <p>© ${new Date().getFullYear()} Techspire Marketplace. All rights reserved.</p>
        <p>Empowering student entrepreneurs across campuses</p>
        
        <div class="social-icons">
          <a href="#" class="social-icon">Twitter</a>
          <a href="#" class="social-icon">Instagram</a>
          <a href="#" class="social-icon">LinkedIn</a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  // Text fallback version
  const text = `
  Techspire Marketplace Email Verification
  ---------------------------------------
  
  Hello ${name},
  
  Please use the following OTP to verify your email address:
  
  OTP: ${otp}
  
  This code will expire in 5 minutes.
  
  If you didn't request this, please ignore this email.
  
  © ${new Date().getFullYear()} Techspire Marketplace
  `;

  try {
    console.log(`Sending OTP email to ${email}`);

    const mailOptions: MailOptions = {
      from: `"Techspire Marketplace" <${
        process.env.SMTP_USER || process.env.EMAIL
      }>`,
      to: email,
      subject,
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};
