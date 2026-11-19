import httpStatus from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import { deleteCloudinaryImage, uploadImage } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	buildAdjacency,
	getRewatchOrder as buildRewatchOrder,
	wouldCreateCycle,
} from "../../utils/graph";
import { getPagination } from "../../utils/pagination";
import type {
	TCreateMoviePayload,
	TMovieListQuery,
	TUpdateMoviePayload,
} from "./movie.interface";

const movieSelect = {
	id: true,
	title: true,
	releaseYear: true,
	runtimeMinutes: true,
	watched: true,
	imageUrl: true,
	createdAt: true,
	updatedAt: true,
	prerequisiteLinks: { select: { prerequisiteId: true } },
} as const;

type TMovieRecord = {
	id: string;
	title: string;
	releaseYear: number;
	runtimeMinutes: number;
	watched: boolean;
	imageUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
	prerequisiteLinks: { prerequisiteId: string }[];
};

const toMovieResponse = (movie: TMovieRecord) => {
	const { prerequisiteLinks, ...rest } = movie;

	return {
		...rest,
		prerequisiteIds: prerequisiteLinks.map((link) => link.prerequisiteId),
	};
};

const unique = (ids: string[]) => [...new Set(ids)];

const getEdges = () =>
	prisma.moviePrerequisite.findMany({
		select: { movieId: true, prerequisiteId: true },
	});

const assertMoviesExist = async (ids: string[]) => {
	if (ids.length === 0) return;

	const count = await prisma.movie.count({ where: { id: { in: ids } } });

	if (count !== ids.length) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"One or more prerequisite movies do not exist.",
			"VALIDATION_ERROR",
		);
	}
};

const create = async (
	payload: TCreateMoviePayload,
	file?: Express.Multer.File,
) => {
	const prerequisiteIds = unique(payload.prerequisiteIds);

	await assertMoviesExist(prerequisiteIds);

	let image: Awaited<ReturnType<typeof uploadImage>> | undefined;

	try {
		if (file) {
			image = await uploadImage(
				file,
				"cinequest/movies",
				"Failed to upload movie image.",
			);
		}

		const movie = await prisma.movie.create({
			data: {
				title: payload.title,
				releaseYear: payload.releaseYear,
				runtimeMinutes: payload.runtimeMinutes,
				...(image ?? {}),
				prerequisiteLinks: {
					create: prerequisiteIds.map((prerequisiteId) => ({
						prerequisite: { connect: { id: prerequisiteId } },
					})),
				},
			},
			select: movieSelect,
		});

		return toMovieResponse(movie);
	} catch (error) {
		await deleteCloudinaryImage(image?.imagePublicId);
		throw error;
	}
};

const list = async (query: TMovieListQuery) => {
	const { page, limit, skip } = getPagination(query.page, query.limit, 20);

	const where: Prisma.MovieWhereInput = {
		...(query.search
			? { title: { contains: query.search, mode: "insensitive" } }
			: {}),
		...(query.watched !== undefined ? { watched: query.watched } : {}),
	};

	const [movies, total] = await Promise.all([
		prisma.movie.findMany({
			where,
			select: movieSelect,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.movie.count({ where }),
	]);

	return {
		data: movies.map(toMovieResponse),
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

const update = async (
	id: string,
	payload: TUpdateMoviePayload,
	file?: Express.Multer.File,
) => {
	const existing = await prisma.movie.findUnique({
		where: { id },
		select: { id: true, imagePublicId: true },
	});

	if (!existing) {
		throw new AppError(httpStatus.NOT_FOUND, "Movie not found.", "NOT_FOUND");
	}

	let nextPrerequisiteIds: string[] | undefined;

	if (payload.prerequisiteIds !== undefined) {
		nextPrerequisiteIds = unique(payload.prerequisiteIds);

		await assertMoviesExist(nextPrerequisiteIds);

		if (
			wouldCreateCycle(
				id,
				nextPrerequisiteIds,
				buildAdjacency(await getEdges()),
			)
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"These prerequisites would create a circular dependency.",
				"CIRCULAR_DEPENDENCY",
			);
		}
	}

	let image: Awaited<ReturnType<typeof uploadImage>> | undefined;

	try {
		if (file) {
			image = await uploadImage(
				file,
				"cinequest/movies",
				"Failed to upload movie image.",
			);
		}

		await prisma.$transaction(async (tx) => {
			await tx.movie.update({
				where: { id },
				data: {
					...(payload.title !== undefined ? { title: payload.title } : {}),
					...(payload.releaseYear !== undefined
						? { releaseYear: payload.releaseYear }
						: {}),
					...(payload.runtimeMinutes !== undefined
						? { runtimeMinutes: payload.runtimeMinutes }
						: {}),
					...(payload.watched !== undefined
						? { watched: payload.watched }
						: {}),
					...(image ?? {}),
				},
			});

			if (nextPrerequisiteIds !== undefined) {
				await tx.moviePrerequisite.deleteMany({ where: { movieId: id } });

				if (nextPrerequisiteIds.length > 0) {
					await tx.moviePrerequisite.createMany({
						data: nextPrerequisiteIds.map((prerequisiteId) => ({
							movieId: id,
							prerequisiteId,
						})),
					});
				}
			}
		});

		if (image) {
			await deleteCloudinaryImage(existing.imagePublicId);
		}

		const movie = await prisma.movie.findUniqueOrThrow({
			where: { id },
			select: movieSelect,
		});

		return toMovieResponse(movie);
	} catch (error) {
		await deleteCloudinaryImage(image?.imagePublicId);
		throw error;
	}
};

const getRewatchOrder = async (id: string) => {
	const target = await prisma.movie.findUnique({
		where: { id },
		select: { id: true, title: true },
	});

	if (!target) {
		throw new AppError(httpStatus.NOT_FOUND, "Movie not found.", "NOT_FOUND");
	}

	const [movies, edges] = await Promise.all([
		prisma.movie.findMany({
			select: {
				id: true,
				title: true,
				releaseYear: true,
				runtimeMinutes: true,
				watched: true,
			},
			orderBy: [{ releaseYear: "asc" }, { title: "asc" }],
		}),
		getEdges(),
	]);

	const movieById = new Map(movies.map((movie) => [movie.id, movie]));
	const ordered = buildRewatchOrder(id, edges)
		.filter((movieId) => movieId !== id)
		.map((movieId) => movieById.get(movieId))
		.filter((movie): movie is NonNullable<typeof movie> => Boolean(movie));

	return {
		target,
		movies: ordered,
		totalCount: ordered.length,
		watchedCount: ordered.filter((movie) => movie.watched).length,
		unwatchedTotalRuntimeMinutes: ordered
			.filter((movie) => !movie.watched)
			.reduce((total, movie) => total + movie.runtimeMinutes, 0),
	};
};

export const MovieService = { create, list, update, getRewatchOrder };
