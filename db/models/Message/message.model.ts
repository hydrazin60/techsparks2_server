import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  reciver: mongoose.Types.ObjectId;
  content?: string;
  messageType: "text" | "image" | "file";
  mediaUrl?: string; // For images or files
  fileName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reciver: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    content: {
      type: String,
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    mediaUrl: {
      type: String, // Cloudinary / S3 / Firebase path
    },
    fileName: {
      type: String, // Original file name (for files)
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMessage>("Message", messageSchema);
