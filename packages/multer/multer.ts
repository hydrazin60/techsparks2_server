// import multer, { FileFilterCallback } from "multer";
// import { Request } from "express";

// const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
// const allowedTypes = [
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/webp",
//   "image/gif",
//   "image/bmp",
//   "image/svg+xml",
//   "image/tiff",
//   "image/x-icon",
// ];

// const storage = multer.memoryStorage();

// const fileFilter = (
//   req: Request,
//   file: Express.Multer.File,
//   cb: FileFilterCallback
// ) => {
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file type. Only image files are allowed."));
//   }
// };

// const upload = multer({
//   storage,
//   limits: { fileSize: MAX_FILE_SIZE },
//   fileFilter,
// });

// export const uploadSingleImage = (fieldName: string) => upload.single(fieldName);
// export const uploadMultipleImages = (fieldName: string, maxCount: number = 6) =>
//   upload.array(fieldName, maxCount);

import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/tiff",
  "image/x-icon",
];

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files are allowed."));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadSingleImage = (fieldName: string) => upload.single(fieldName);
export const uploadMultipleImages = (fieldName: string, maxCount: number = 6) =>
  upload.array(fieldName, maxCount);