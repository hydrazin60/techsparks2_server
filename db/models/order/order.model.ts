import mongoose, { Document, Schema } from "mongoose";

// Interface for individual ordered item
interface IOrderItem {
  product: mongoose.Types.ObjectId; // Reference to Product
  category: "general" | "marketing" | "tech";
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

// Interface for the Order document
export interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  startup?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  orderStatus: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod?: "wallet" | "cash_on_delivery" | "mock_gateway";
  shippingAddress?: string;
  isEcoFriendlyOrder?: boolean;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    category: {
      type: String,
      enum: ["general", "marketing", "tech"],
      required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false }
);

// Order schema definition
const orderSchema = new Schema<IOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startup: { type: Schema.Types.ObjectId, ref: "Startup" },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },

    paymentMethod: {
      type: String,
      enum: ["wallet", "cash_on_delivery", "mock_gateway"],
    },

    shippingAddress: {
      type: String,
    },

    isEcoFriendlyOrder: {
      type: Boolean,
      default: false,
    },

    estimatedDelivery: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
