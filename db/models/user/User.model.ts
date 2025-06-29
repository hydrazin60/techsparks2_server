import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  address?: string;
  gender?: string;
  googleId?: string;
  githubId?: string;
  phone?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  collegeId?: string;
  role: "student" | "mentor" | "startup";
  reviews?: mongoose.Types.ObjectId[];
  collegeEmail?: string;
  isVerifiedStudent: boolean;
  isVerifiedMentor: boolean;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  notifications?: string[];
  notificationsCount?: number;
  friends?: mongoose.Types.ObjectId[];
  bookmarks?: mongoose.Types.ObjectId[];
  avatar?: string;
  college?: string;
  department?: string; //
  bio?: string;
  chats?: mongoose.Types.ObjectId[];
  startups?: mongoose.Types.ObjectId[];
  expertiseAreas?: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      select: false, // hide by default
    },
    phone: { type: String, match: /^(\+\d{1,3}[- ]?)?\d{10}$/ },
    googleId: { type: String },
    githubId: { type: String },
    address: { type: String },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
    },
    gender: { type: String, enum: ["male", "female", "other"] },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    collegeId: { type: String },
    collegeEmail: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true, // to avoid conflict when not provided
    },

    isVerifiedStudent: {
      type: Boolean,
      default: false,
    },

    isVerifiedMentor: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    college: { type: String },
    department: { type: String },
    bio: { type: String },

    chats: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
    startups: [{ type: Schema.Types.ObjectId, ref: "Startup" }],
    expertiseAreas: [{ type: String }], // Array of expertise areas

    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],

    bookmarks: [{ type: Schema.Types.ObjectId }],

    notifications: [{ type: String }],
    notificationsCount: {
      type: Number,
      default: 0,
    },

    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    socialLinks: {
      linkedin: { type: String },
      github: { type: String },
      website: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", userSchema);
