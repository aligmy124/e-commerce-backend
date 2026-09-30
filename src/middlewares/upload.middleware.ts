import multer from "multer";
import { AppError } from "../utils/AppError";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError("Only JPEG, PNG and WebP images are allowed", 400));
    }

    cb(null, true);
  },
});
