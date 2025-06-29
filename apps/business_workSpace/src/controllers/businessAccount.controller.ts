import { NextFunction, Request, Response } from "express";
import { AuthError, ValidationError } from "../../../../packages/error_handler";
import mongoose from "mongoose";
import User from "../../../../db/models/user/User.model";

export const createBusinessAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AuthError("Invalid user ID");
    }

    // Find user and validate role
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AuthError("User not found");
    }

    if (user.role !== "student") {
      throw new AuthError(
        `You are already a ${user.role}. No need to upgrade account.`
      );
    }

    // Validate required fields
    const {
      phone,
      bio,
      college,
      address,
      expertiseAreas = [],
      socialLinks = {},
    } = req.body;
    console.log("hfffffffffffffffffffffffffffffff", req.body);
    if (!phone) {
      throw new ValidationError("Phone number is required");
    }
    if (!bio) {
      throw new ValidationError("Bio is required");
    }

    // Update user to startup role with additional info
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          role: "startup",
          phone,
          bio,
          college,
          address,
          expertiseAreas,
          socialLinks,
          isVerifiedStudent: true, // Assuming they were verified as student
          isVerifiedMentor: false, // Reset mentor verification if existed
        },
      },
      { new: true, session }
    ).select("-password");

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Account upgraded to business successfully",
      data: updatedUser,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Business account creation error:", error);
    next(error);
  } finally {
    session.endSession();
  }
};
