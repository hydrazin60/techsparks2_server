import redis from "../../../../packages/redis";
import crypto from "crypto";
import { ValidationError } from "../../../../packages/error_handler";
import { sendOTPVerificationEmail } from "../services/email/emailVerifyOTP";

import { NextFunction } from "express";

interface RegistrationData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
}

export const validateRegistrationData = (
  data: Partial<RegistrationData> = {}
): { valid: boolean; error?: ValidationError } => {
  const { email = "", password = "" } = data;

  // Email validation
  if (!email.trim()) {
    return {
      valid: false,
      error: new ValidationError("Email is required"),
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      valid: false,
      error: new ValidationError("Invalid email format"),
    };
  }

  // Password validation
  if (!password.trim()) {
    return {
      valid: false,
      error: new ValidationError("Password is required"),
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: new ValidationError("Password must be at least 8 characters"),
    };
  }

  return { valid: true };
};

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "Account is locked due to multiple failed attempts. Try again after 30 minutes."
      )
    );
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 hour before trying again."
      )
    );
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 minute before trying again."
      )
    );
  }
};

interface SendOTPParams {
  email: string;
  name: string;
  template: "user-activation-mail";
}

export const sendOTP = async ({
  email,
  name,
  template,
}: SendOTPParams): Promise<string> => {
  const OTP = crypto.randomInt(1000, 9999).toString();

  switch (template) {
    case "user-activation-mail":
      await sendOTPVerificationEmail(email, OTP, name);
      break;
    default:
      throw new Error(`Unsupported email template: ${template}`);
  }

  // Store OTP with 5 minute expiration
  await redis.set(`otp:${email}`, OTP, "EX", 300);

  // Set cooldown for 1 minute
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);

  return OTP;
};

export const verifyOTP = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const storedOTP = await redis.get(`otp:${email}`);

  console.log(`Stored OTP for ${email}: ${storedOTP}`);
  console.log(`Received OTP: ${otp}`);

  if (!storedOTP) {
    throw new ValidationError(
      "OTP expired or not found. Please request a new OTP."
    );
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  const attempts = parseInt((await redis.get(failedAttemptsKey)) || "0") + 1;

  if (storedOTP.trim() !== otp.trim()) {
    if (attempts >= 3) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError(
        "Too many attempts. Try again after 30 minutes."
      );
    }

    await redis.set(failedAttemptsKey, attempts.toString(), "EX", 300);
    throw new ValidationError(
      `Invalid OTP. ${3 - attempts} attempts remaining`
    );
  }

  // Cleanup on successful verification
  await redis.del(`otp:${email}`, failedAttemptsKey);
  return true;
};

export const trackOTPRequests = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  const otpRequestKey = `otp_request_count:${email}`;
  const currentCount = parseInt((await redis.get(otpRequestKey)) || "0");

  if (currentCount >= 3) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    return next(
      new ValidationError(
        "Too many OTP requests. Please wait 1 hour before trying again."
      )
    );
  }

  // Increment count and set 1 hour expiration
  await redis.set(otpRequestKey, (currentCount + 1).toString(), "EX", 3600);
};
