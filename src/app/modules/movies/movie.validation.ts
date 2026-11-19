import httpStatus from "http-status";
import { z } from "zod";
import { AppError } from "../../utils/AppError";
import type { TMovieListQuery } from "./movie.interface";

const titleSchema = z
	.string("Title must be a string.")
	.trim()
	.min(1, "Title is required.")
	.max(200, "Title must be at most 200 characters long.");

const releaseYearSchema = z.coerce
	.number()
	.int()
	.min(1888, "Release year must be 1888 or later.")
	.max(2100, "Release year must be 2100 or earlier.");

const runtimeMinutesSchema = z.coerce
	.number()
	.int()
	.min(1, "Runtime must be at least 1 minute.")
	.max(300, "Runtime must be at most 300 minutes.");

const prerequisiteIdsSchema = z.preprocess(
	(value) =>
		typeof value === "string"
			? value
					.split(",")
					.map((part) => part.trim())
					.filter(Boolean)
			: value,
	z.array(z.string().uuid("Each prerequisite must be a valid movie ID.")),
);

const watchedSchema = z.preprocess((value) => {
	if (value === "true") return true;
	if (value === "false") return false;

	return value;
}, z.boolean());

const listQuerySchema = z
	.object({
		search: z.string().trim().max(200).optional(),
		watched: z.enum(["true", "false"]).optional(),
		page: z.coerce.number().int().min(1).optional(),
		limit: z.coerce.number().int().min(1).max(100).optional(),
	})
	.strict();

export const createMovieSchema = z
	.object({
		title: titleSchema,
		releaseYear: releaseYearSchema,
		runtimeMinutes: runtimeMinutesSchema,
		watched: watchedSchema.optional().default(false),
		prerequisiteIds: prerequisiteIdsSchema.optional().default([]),
	})
	.strict();

export const updateMovieSchema = z
	.object({
		title: titleSchema.optional(),
		releaseYear: releaseYearSchema.optional(),
		runtimeMinutes: runtimeMinutesSchema.optional(),
		watched: watchedSchema.optional(),
		prerequisiteIds: prerequisiteIdsSchema.optional(),
	})
	.strict()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required.",
	});

export const parseMovieListQuery = (query: unknown): TMovieListQuery => {
	const result = listQuerySchema.safeParse(query ?? {});

	if (!result.success) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			result.error.issues[0]?.message ?? "Invalid query parameters.",
			"VALIDATION_ERROR",
		);
	}

	const { search, watched, page, limit } = result.data;

	return {
		search: search || undefined,
		watched: watched === undefined ? undefined : watched === "true",
		page: page ?? 1,
		limit: limit ?? 20,
	};
};
