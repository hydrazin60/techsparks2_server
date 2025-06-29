import mongoose, { Document, Schema } from "mongoose";
export interface IStartup extends Document {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  founders: mongoose.Types.ObjectId[]; // List of User IDs
  chat?: mongoose.Types.ObjectId[]; // group chat for startup mentors
  products?: mongoose.Types.ObjectId[]; // Linked products
  tags?: string[]; // e.g., ['clothing', 'handmade', 'eco-friendly']
  verified: boolean;
  mentors?: mongoose.Types.ObjectId[]; // Linked mentors (Users)
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    github?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const startupSchema: Schema<IStartup> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    logo: { type: String }, // URL to logo image
    website: { type: String },
    founders: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    tags: [{ type: String }],
    chat: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
    verified: { type: Boolean, default: false },
    mentors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Assuming mentors are also users with role "mentor"
      },
    ],
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      linkedin: { type: String },
      github: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IStartup>("Startup", startupSchema);
