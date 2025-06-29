import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction {
  type: "add" | "spend" | "refund" | "withdraw";
  amount: number;
  status: "pending" | "success" | "failed";
  method?: "khalti" | "system" | "mock";
  description?: string;
  transactionId?: string; // Gateway transaction reference (e.g., Khalti token)
  createdAt?: Date;
}

export interface IWallet extends Document {
  user: mongoose.Types.ObjectId;
  balance: number;
  transactions: ITransaction[];
  lastUpdated?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ["add", "spend", "refund", "withdraw"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    method: {
      type: String,
      enum: ["khalti", "system", "mock"],
    },
    description: {
      type: String,
    },
    transactionId: {
      type: String, // From Khalti or internal txn ref
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [transactionSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWallet>("Wallet", walletSchema);
