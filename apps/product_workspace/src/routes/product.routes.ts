import express from "express";
import { isAuthenticated } from "../../../../packages/middleware/IsAuthenticated";
import { uploadMultipleImages } from "../../../../packages/multer/multer";
import { uploadProduct } from "../controllers/upload.product";

const productRoutes = express.Router();

// Explicitly type the middleware chain
productRoutes.post(
  "/upload_product",
  isAuthenticated,
  uploadMultipleImages("images", 5) as express.RequestHandler, // Type assertion
  uploadProduct as express.RequestHandler // Type assertion
);

export default productRoutes;
