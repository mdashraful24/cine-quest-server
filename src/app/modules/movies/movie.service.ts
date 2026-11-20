import { randomUUID } from "node:crypto";
import httpStatus from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	CIRCULAR_DEPENDENCY_MESSAGE,
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

const createMovie = async (payload: TCreateMoviePayload) => {
	const movieId = randomUUID();
	const prerequisiteIds = unique(payload.prerequisiteIds);

	await assertMoviesExist(prerequisiteIds);

	if (
		wouldCreateCycle(movieId, prerequisiteIds, buildAdjacency(await getEdges()))
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"These prerequisites would create a circular dependency.",
			"CIRCULAR_DEPENDENCY",
		);
	}

	const movie = await prisma.movie.create({
		data: {
			id: movieId,
			title: payload.title,
			releaseYear: payload.releaseYear,
			runtimeMinutes: payload.runtimeMinutes,
			watched: payload.watched,
			prerequisiteLinks: {
				create: prerequisiteIds.map((prerequisiteId) => ({
					prerequisite: { connect: { id: prerequisiteId } },
				})),
			},
		},
		select: movieSelect,
	});

	return toMovieResponse(movie);
};

const movieList = async (query: TMovieListQuery) => {
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

const updateMovie = async (id: string, payload: TUpdateMoviePayload) => {
	const existing = await prisma.movie.findUnique({
		where: { id },
		select: { id: true },
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

	const operations: Prisma.PrismaPromise<unknown>[] = [
		prisma.movie.update({
			where: { id },
			data: {
				...(payload.title !== undefined ? { title: payload.title } : {}),
				...(payload.releaseYear !== undefined
					? { releaseYear: payload.releaseYear }
					: {}),
				...(payload.runtimeMinutes !== undefined
					? { runtimeMinutes: payload.runtimeMinutes }
					: {}),
				...(payload.watched !== undefined ? { watched: payload.watched } : {}),
			},
		}),
	];

	if (nextPrerequisiteIds !== undefined) {
		operations.push(
			prisma.moviePrerequisite.deleteMany({ where: { movieId: id } }),
		);

		if (nextPrerequisiteIds.length > 0) {
			operations.push(
				prisma.moviePrerequisite.createMany({
					data: nextPrerequisiteIds.map((prerequisiteId) => ({
						movieId: id,
						prerequisiteId,
					})),
				}),
			);
		}
	}

	await prisma.$transaction(operations);

	const movie = await prisma.movie.findUniqueOrThrow({
		where: { id },
		select: movieSelect,
	});

	return toMovieResponse(movie);
};

const deleteMovie = async (id: string) => {
	const movie = await prisma.movie.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!movie) {
		throw new AppError(httpStatus.NOT_FOUND, "Movie not found.", "NOT_FOUND");
	}

	await prisma.moviePrerequisite.deleteMany({
		where: {
			OR: [{ movieId: id }, { prerequisiteId: id }],
		},
	});

	await prisma.movie.delete({ where: { id } });

	return { id };
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
	let orderedIds: string[];

	try {
		orderedIds = buildRewatchOrder(id, edges);
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === CIRCULAR_DEPENDENCY_MESSAGE
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"These prerequisites would create a circular dependency.",
				"CIRCULAR_DEPENDENCY",
			);
		}

		throw error;
	}

	const ordered = orderedIds
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

export const MovieService = {
	createMovie,
	movieList,
	updateMovie,
	deleteMovie,
	getRewatchOrder,
};
