import mongoose, { Document, Schema } from "mongoose";

// Interface for the Product document
export interface IProduct extends Document {
  productName: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  price: number;
  finalPrice: number;
  discount: number;
  cupponcode?: string;
  quantityAvailable?: number;
  status: string;
  review?: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  statup?: mongoose.Types.ObjectId;
  biare?: mongoose.Types.ObjectId;
  specifications?: {
    key: string;
    value: string;
  };
  rawMaterial?: {
    key: string;
    value: string;
  };
  ecoFriendly?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose schema definition
const productSchema: Schema<IProduct> = new Schema(
  {
    productName: { type: String, required: true },
    shortDescription: { type: String },
    description: { type: String },
    images: [{ type: String }],
    discount: { type: Number, default: 0 },
    cupponcode: { type: String },
    finalPrice: { type: Number, default: 0 },
    price: { type: Number, required: true },
    quantityAvailable: { type: Number, default: 0 },
    review: { type: Schema.Types.ObjectId, ref: "Review" },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    statup: { type: Schema.Types.ObjectId, ref: "Startup" },
    biare: { type: Schema.Types.ObjectId, ref: "Biare" },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted", "tranding"],
      default: "active",
    },
    specifications: {
      key: { type: String },
      value: { type: String },
    },
    rawMaterial: {
      key: { type: String },
      value: { type: String },
    },
    ecoFriendly: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Export the model
export default mongoose.model<IProduct>("Product", productSchema);
