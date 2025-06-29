import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthError, ValidationError } from "../../../../packages/error_handler";
import UserModel from "../../../../db/models/user/User.model";
import startupModel from "../../../../db/models/startups/startup.model";

export const createStartup = async (
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

    // Find user with session
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new AuthError("User not found");
    }

    // Only allow business accounts (startup role) or mentors to create startups
    if (user.role !== "startup" && user.role !== "mentor") {
      throw new AuthError(
        "Only business accounts and mentors can create startups"
      );
    }

    // Validate required fields
    const { name, description } = req.body;
    if (!name) {
      throw new ValidationError("Startup name is required");
    }

    // Check if startup with this name already exists
    const existingStartup = await startupModel
      .findOne({ name })
      .session(session);
    if (existingStartup) {
      throw new ValidationError("Startup with this name already exists");
    }

    // Create new startup
    const newStartup = await startupModel.create(
      [
        {
          name,
          description,
          logo: req.body.logo,
          website: req.body.website,
          founders: [userId],
          tags: req.body.tags || [],
          socialLinks: req.body.socialLinks || {},
        },
      ],
      { session }
    );

    // Update user document in parallel
    const updateUser = UserModel.findByIdAndUpdate(
      userId,
      {
        $push: { startups: newStartup[0]._id }, // Add startup to user's startups array
        $set: { role: "startup" }, // Update role if not already startup
      },
      { session, new: true }
    );

    await Promise.all([updateUser]);
    await session.commitTransaction();

    // Populate founder details
    const populatedStartup = await startupModel
      .findById(newStartup[0]._id)
      .populate({
        path: "founders",
        select: "-password -__v",
      })
      .exec();

    return res.status(201).json({
      success: true,
      message: "Startup created successfully",
      data: populatedStartup,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
