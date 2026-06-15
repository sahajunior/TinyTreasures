import multer from "multer";
import { ApiError } from "../utils/ApiError";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 7,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new ApiError(400, "Only image files are allowed"));
      return;
    }
    callback(null, true);
  },
});

export const uploadProductImages = upload.array("images", 7);
export const uploadProductImage = upload.single("image");
