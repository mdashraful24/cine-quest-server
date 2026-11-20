import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	TCreateMoviePayload,
	TUpdateMoviePayload,
} from "./movie.interface";
import { MovieService } from "./movie.service";
import { parseMovieListQuery } from "./movie.validation";

const createMovie = catchAsync(async (req, res) => {
	const movie = await MovieService.createMovie(req.body as TCreateMoviePayload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Movie created successfully.",
		data: movie,
	});
});

const movieList = catchAsync(async (req, res) => {
	const result = await MovieService.movieList(parseMovieListQuery(req.query));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Movies fetched successfully.",
		data: result.data,
		meta: result.meta,
	});
});

const updateMovie = catchAsync(async (req, res) => {
	const movie = await MovieService.updateMovie(
		String(req.params.id),
		req.body as TUpdateMoviePayload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Movie updated successfully.",
		data: movie,
	});
});

const deleteMovie = catchAsync(async (req, res) => {
	const result = await MovieService.deleteMovie(String(req.params.id));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Movie deleted successfully.",
		data: result,
	});
});

const getRewatchOrder = catchAsync(async (req, res) => {
	const result = await MovieService.getRewatchOrder(String(req.params.id));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Rewatch order generated successfully.",
		data: result,
	});
});

export const MovieController = {
	createMovie,
	movieList,
	updateMovie,
	deleteMovie,
	getRewatchOrder,
};
