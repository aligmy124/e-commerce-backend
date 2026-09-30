import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError";
import multer from "multer";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Max size is 5MB",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.code}`,
    });
  }
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  console.error(error.stack);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
