import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { TCreateCinemaPayload } from "./cinema.interface";
import { CinemaService } from "./cinema.service";
import { parseBookingQuery } from "./cinema.validation";

const createCinema = catchAsync(async (req, res) => {
	const cinema = await CinemaService.createCinema(
		req.body as TCreateCinemaPayload,
		req.file,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Cinema created successfully.",
		data: cinema,
	});
});

const cinemaList = catchAsync(async (_req, res) => {
	const cinemas = await CinemaService.cinemaList();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Cinemas fetched successfully.",
		data: cinemas,
	});
});

const getBookingQuote = catchAsync(async (req, res) => {
	const { groupSize } = parseBookingQuery(req.query);
	const quote = await CinemaService.getBookingQuote(
		String(req.params.id),
		groupSize,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: quote.possible
			? "Booking quote generated successfully."
			: "No exact bundle combination is possible.",
		data: quote,
	});
});

export const CinemaController = {
	createCinema,
	cinemaList,
	getBookingQuote
};
