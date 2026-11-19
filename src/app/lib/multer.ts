import httpStatus from "http-status";
import multer from "multer";
import { AppError } from "../utils/AppError";

const allowedImageTypes = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

export const IMAGE_FILE_SIZE_LIMIT = 5 * 1024 * 1024;

export const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: IMAGE_FILE_SIZE_LIMIT, files: 1 },
	fileFilter: (_req, file, callback) => {
		if (!allowedImageTypes.has(file.mimetype)) {
			callback(
				new AppError(
					httpStatus.BAD_REQUEST,
					"Only JPEG, PNG, WebP or GIF image files are allowed.",
				),
			);
			return;
		}

		callback(null, true);
	},
});
