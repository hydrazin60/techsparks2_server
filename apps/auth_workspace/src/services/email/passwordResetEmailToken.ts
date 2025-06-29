import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import User from "../../../../../db/models/user/User.model";
import redis from "../../../../../packages/redis";
import { AuthError } from "../../../../../packages/error_handler";

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

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  name: string = "User"
): Promise<boolean> => {
  const subject = "Reset Your Techspire Marketplace Password";

  const resetLink = `${
    process.env.FRONTEND_URL
  }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

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
      
      /* Token Box */
      .token-container { background: #f9fafb; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; border: 1px dashed #d1d5db; }
      .token-code { font-size: 14px; word-break: break-all; color: #4f46e5; font-weight: 700; margin: 12px 0; font-family: monospace; }
      .token-expiry { color: #6b7280; font-size: 14px; }
      
      /* Button */
      .action-button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
      
      /* Footer */
      .email-footer { padding: 24px; text-align: center; background: #f9fafb; color: #6b7280; font-size: 14px; }
      .footer-link { color: #4f46e5; text-decoration: none; }
      
      /* Responsive */
      @media (max-width: 480px) {
        .email-content { padding: 24px; }
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
        <p class="message">We received a request to reset your Techspire Marketplace password. Use the following token to reset your password:</p>
        
        <div class="token-container">
          <p>Your password reset token is:</p>
          <div class="token-code">${resetToken}</div>
          <p class="token-expiry">This token will expire in 10 minutes.</p>
        </div>
        
        <p class="message">Or click the button below to go directly to the password reset page:</p>
        <a href="${resetLink}" class="action-button">Reset Password</a>
        
        <p class="message" style="margin-top: 24px;">If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
      </div>
      
      <div class="email-footer">
        <p>© ${new Date().getFullYear()} Techspire Marketplace. All rights reserved.</p>
        <p>Empowering student entrepreneurs across campuses</p>
      </div>
    </div>
  </body>
  </html>
  `;

  // Text fallback version
  const text = `
  Techspire Marketplace Password Reset
  -----------------------------------
  
  Hello ${name},
  
  We received a request to reset your password. Use the following token to reset your password:
  
  Token: ${resetToken}
  
  This token will expire in 10 minutes.
  
  Or visit this link to reset your password:
  ${resetLink}
  
  If you didn't request this password reset, please ignore this email.
  
  © ${new Date().getFullYear()} Techspire Marketplace
  `;

  try {
    console.log(`Sending password reset email to ${email}`);

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
    console.log("Password reset email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

export const handleForgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AuthError("User not found"));
    }

    // Generate token
   const otp = crypto.randomInt(1000, 9999).toString();


    // Store for 10 minutes
    await redis.set(`password_reset_token:${email}`,  otp, "EX", 600);

    // Send the email
    const sent = await sendPasswordResetEmail(
      email,
      otp,
      user.name || "User"
    );
    if (!sent) {
      throw new Error("Failed to send reset email");
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (err) {
    return next(err);
  }
};

export const userForgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  handleForgetPassword(req, res, next);
};
