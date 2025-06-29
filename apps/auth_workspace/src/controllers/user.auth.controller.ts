import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  checkOtpRestrictions,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
  verifyOTP,
} from "../utils/auth_helper";
import User from "../../../../db/models/user/User.model";
import { ValidationError, AuthError } from "../../../../packages/error_handler";

const setCookies = (res: Response, token: string, value: string) => {
  res.cookie(token, value, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const UserRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { valid, error } = validateRegistrationData(req.body);
    if (!valid) {
      throw new ValidationError(error?.message || "Invalid registration data");
    }

    const { email, collegeId, name } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ValidationError("You are already registered! Please login");
    }

    await checkOtpRestrictions(email as string, next);
    await trackOTPRequests(email as string, next);

    const otp = await sendOTP({
      email,
      name,
      template: "user-activation-mail",
    });
    console.log(`OTP sent to ${email}: ${otp}`);
    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}`,
      data: {
        email,
        collegeId,
        otpExpiresIn: "5 minutes",
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyUserOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, otp, collegeId } = req.body;

    if (!otp) throw new ValidationError("OTP is required");
    if (!email || !password || !name) {
      throw new ValidationError("All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError("Email already registered");
    }

    const isOTPValid = await verifyOTP(email, otp);
    if (!isOTPValid) {
      throw new ValidationError("Invalid OTP");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashPassword,
      collegeId,
    });

    await newUser.save();

    const userData = newUser.toObject();
    delete userData.password;
    delete userData.passwordResetToken;
    delete userData.passwordResetExpires;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: userData,
    });
  } catch (err) {
    next(err);
  }
};

export const LoginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Please provide all required fields");
    }

    // Make sure password is selected
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new AuthError("User not found"));
    }

    if (!user.password) {
      return next(new AuthError("Invalid credentials"));
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return next(new AuthError("Invalid credentials"));
    }

    const accessSecret =
      process.env.ACCESS_TOKEN_SECRET ?? "your-access-secret";
    const refreshSecret =
      process.env.REFRESH_TOKEN_SECRET ?? "your-refresh-secret";

    const accessToken = jwt.sign({ id: user._id, role: "user" }, accessSecret, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { id: user._id, role: "user" },
      refreshSecret,
      { expiresIn: "7d" }
    );

    setCookies(res, "accessToken", accessToken);
    setCookies(res, "refreshToken", refreshToken);

    // Remove password from user object
    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: userData,
    });
  } catch (err) {
    return next(err);
  }
};
