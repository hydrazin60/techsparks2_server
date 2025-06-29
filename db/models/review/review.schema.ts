import mongoose, { Document, Schema } from "mongoose";

// Interface for nested comments under a review
interface IReviewComment {
  commenter: mongoose.Types.ObjectId;
  commentText: string;
  createdAt?: Date;
}

// Interface for reactions under a review
interface IReaction {
  user: mongoose.Types.ObjectId;
  type: "like" | "helpful" | "funny" | "love"; // You can expand this
}

// Interface for main Review
export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  reactions?: IReaction[];
  comments?: IReviewComment[];
  isApproved?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definition
const reviewSchema: Schema<IReview> = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    images: [{ type: String }], // Image URLs (Cloudinary, etc.)

    // Reactions (users reacting to this review)
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "helpful", "funny", "love"],
          default: "like",
        },
      },
    ],

    // Comment thread on this review
    comments: [
      {
        commenter: { type: Schema.Types.ObjectId, ref: "User" },
        commentText: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IReview>("Review", reviewSchema);
