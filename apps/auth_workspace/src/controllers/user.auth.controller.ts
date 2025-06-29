import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  checkOtpRestrictions,
  handleForgetPassword,
  handleVerifyForgetPasswordOTP,
  sendOTP,
  trackOTPRequests,
  validateRegistrationData,
  verifyOTP,
} from "../utils/auth_helper";
import User from "../../../../db/models/user/User.model";
import { ValidationError, AuthError } from "../../../../packages/error_handler";
import redis from "../../../../packages/redis";
import mongoose from "mongoose";

// Function to set cookies
const setCookies = (res: Response, token: string, value: string) => {
  res.cookie(token, value, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Function to handle user registration
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

// Function to handle user OTP verification
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
// Function to handle user login
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

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password as string
    );

    if (!isPasswordMatch) {
      return next(new AuthError("Password does not match"));
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

export const LogOutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("accessToken", {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    });
    res.clearCookie("refreshToken", {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    });
    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
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

export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, Newpassword } = req.body;
    if (!email || !Newpassword) {
      throw new ValidationError("Please provide all required fields");
    }

    // Check if OTP was verified
    const isVerified = await redis.get(`password_reset_verified:${email}`);
    if (!isVerified) {
      throw new ValidationError(
        "Password reset not authorized. Please verify OTP first."
      );
    }

    // Make sure to select the password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ValidationError("User not found");
    }

    // Check if password exists (modified to handle cases where password might be undefined)
    if (user.password === undefined || user.password === null) {
      // If no password exists (new user flow?), just set the new password
      const hashedPassword = await bcrypt.hash(Newpassword, 10);
      await User.updateOne({ email }, { $set: { password: hashedPassword } });
    } else {
      // Existing password flow
      const isSamePassword = await bcrypt.compare(Newpassword, user.password);
      if (isSamePassword) {
        throw new ValidationError(
          "New password cannot be same as old password"
        );
      }

      const hashedPassword = await bcrypt.hash(Newpassword, 10);
      await User.updateOne({ email }, { $set: { password: hashedPassword } });
    }

    // Cleanup verification flag
    await redis.del(`password_reset_verified:${email}`);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyUserForgetPassswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  handleVerifyForgetPasswordOTP(req, res, next);
};

export const ViewOwnProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownId = req.userId; // Get the user ID from the request
    if (!ownId || !mongoose.Types.ObjectId.isValid(ownId)) {
      return next(new AuthError("invlided user id"));
    }
    const user = await User.findById(ownId).select("-password");
    if (!user) {
      return next(new AuthError("User not found ! please register first"));
    }
    const userData = await User.findById(ownId).select("-password");
    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: userData,
    });
  } catch (err) {
    console.log(`Error in ViewOwnProfile: ${err}`);
    return next(err);
  }
};
