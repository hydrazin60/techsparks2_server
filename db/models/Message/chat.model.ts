import mongoose, { Document, Schema } from "mongoose";

// Interface for Chat
export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[]; // Users in this chat
  messages: mongoose.Types.ObjectId[];
  isGroupChat?: boolean;
  chatName?: string; // Optional for group chats
  createdAt?: Date;
  updatedAt?: Date;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
        required: true,
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    chatName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IChat>("Chat", chatSchema);
