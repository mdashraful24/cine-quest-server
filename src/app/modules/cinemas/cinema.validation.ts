import httpStatus from "http-status";
import { z } from "zod";
import { AppError } from "../../utils/AppError";

const nameSchema = z
	.string("Name must be a string.")
	.trim()
	.min(1, "Name is required.")
	.max(200, "Name must be at most 200 characters long.");

const bundleSizesSchema = z.preprocess(
	(value) =>
		typeof value === "string"
			? value
					.split(",")
					.map((part) => part.trim())
					.filter(Boolean)
			: value,
	z
		.array(z.coerce.number().int().min(1).max(500))
		.min(1, "At least one bundle size is required.")
		.max(10, "At most 10 bundle sizes are allowed.")
		.refine((sizes) => new Set(sizes).size === sizes.length, {
			message: "Bundle sizes must be unique.",
		}),
);

const bookingQuerySchema = z
	.object({
		groupSize: z.coerce
			.number()
			.int()
			.min(1, "Group size must be at least 1.")
			.max(10000, "Group size must be at most 10,000."),
	})
	.strict();

export const createCinemaSchema = z
	.object({
		name: nameSchema,
		bundleSizes: bundleSizesSchema,
	})
	.strict();

export const parseBookingQuery = (query: unknown) => {
	const result = bookingQuerySchema.safeParse(query ?? {});

	if (!result.success) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			result.error.issues[0]?.message ?? "Invalid query parameters.",
			"VALIDATION_ERROR",
		);
	}

	return result.data;
};
