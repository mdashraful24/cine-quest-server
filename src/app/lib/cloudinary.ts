import { v2 as Cloudinary } from "cloudinary";
import httpStatus from "http-status";
import config from "../config";
import logger from "../logger";
import { AppError } from "../utils/AppError";

export const isCloudinaryConfigured = Boolean(
	config.cloudinary_cloud_name &&
		config.cloudinary_api_key &&
		config.cloudinary_api_secret,
);

if (isCloudinaryConfigured) {
	Cloudinary.config({
		cloud_name: config.cloudinary_cloud_name,
		api_key: config.cloudinary_api_key,
		api_secret: config.cloudinary_api_secret,
	});
}

type TImageAsset = {
	imageUrl: string;
	imagePublicId: string;
};

export const uploadImage = (
	file: Express.Multer.File,
	folder: string,
	errorMessage: string,
): Promise<TImageAsset> => {
	if (!isCloudinaryConfigured) {
		throw new AppError(
			httpStatus.SERVICE_UNAVAILABLE,
			"Image uploads are not configured.",
		);
	}

	return new Promise((resolve, reject) => {
		const stream = Cloudinary.uploader.upload_stream(
			{ folder, resource_type: "image" },
			(error, result) => {
				if (error || !result) {
					reject(new AppError(httpStatus.BAD_GATEWAY, errorMessage));
					return;
				}

				resolve({
					imageUrl: result.secure_url,
					imagePublicId: result.public_id,
				});
			},
		);

		stream.end(file.buffer);
	});
};

export const deleteCloudinaryImage = async (publicId?: string | null) => {
	if (!publicId || !isCloudinaryConfigured) return;

	try {
		await Cloudinary.uploader.destroy(publicId);
	} catch (error) {
		logger.error("Failed to delete Cloudinary image:", error);
	}
};
