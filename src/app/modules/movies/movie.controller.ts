import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	TCreateMoviePayload,
	TUpdateMoviePayload,
} from "./movie.interface";
import { MovieService } from "./movie.service";
import { parseMovieListQuery } from "./movie.validation";

const create = catchAsync(async (req, res) => {
	const movie = await MovieService.create(
		req.body as TCreateMoviePayload,
		req.file,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Movie created successfully.",
		data: movie,
	});
});

const list = catchAsync(async (req, res) => {
	const result = await MovieService.list(parseMovieListQuery(req.query));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Movies fetched successfully.",
		data: result.data,
		meta: result.meta,
	});
});

const update = catchAsync(async (req, res) => {
	const movie = await MovieService.update(
		String(req.params.id),
		req.body as TUpdateMoviePayload,
		req.file,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Movie updated successfully.",
		data: movie,
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

export const MovieController = { create, list, update, getRewatchOrder };
