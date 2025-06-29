import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../../../../db/models/user/User.model";
import Product from "../../../../db/models/product/product.model";
import getDataUri from "../../../../packages/cloudnary/dataUri";
import cloudinary from "../../../../packages/cloudnary/cloudnary";

interface IFile extends Express.Multer.File {
  buffer: Buffer;
}

interface CustomRequest extends Request {
  userId?: string;
  files?: IFile[];
}

export const uploadProduct = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "student") {
      return res
        .status(403)
        .json({ message: "Only business accounts can upload products" });
    }

    // Get the startup ID from user's startups array
    const startupId = user.startups?.[0] || undefined;

    // Destructure all possible fields from req.body
    const {
      productName,
      price,
      shortDescription,
      description,
      discount = 0,
      couponCode,
      quantityAvailable = 0,
      specifications,
      rawMaterial,
      ecoFriendly = false,
      biare,
      status = "active",
    } = req.body;

    // Required fields validation
    if (!productName || !price) {
      return res
        .status(400)
        .json({ message: "Product name and price are required" });
    }

    // Calculate final price
    const finalPrice = price - (price * discount) / 100;

    // Handle image uploads
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const fileUri = getDataUri(file);
        if (!fileUri) continue;

        const uploadResult = await cloudinary.uploader.upload(fileUri, {
          folder: "products",
          quality: "auto:good",
          fetch_format: "auto",
        });
        imageUrls.push(uploadResult.secure_url);
      }
    }

    // Parse JSON fields if they exist
    let parsedSpecifications;
    let parsedRawMaterial;

    try {
      parsedSpecifications = specifications
        ? JSON.parse(specifications)
        : undefined;
      parsedRawMaterial = rawMaterial ? JSON.parse(rawMaterial) : undefined;
    } catch (error) {
      return res.status(400).json({
        message: "Invalid JSON format for specifications or rawMaterial",
      });
    }

    // Create new product with all fields
    const newProduct = new Product({
      productName,
      price,
      finalPrice,
      discount,
      couponCode: couponCode || undefined,
      shortDescription: shortDescription || undefined,
      description: description || undefined,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      quantityAvailable,
      status,
      seller: user._id,
      statup: startupId,
      biare: biare || undefined,
      specifications: parsedSpecifications,
      rawMaterial: parsedRawMaterial,
      ecoFriendly,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating product",
    });
  }
};
