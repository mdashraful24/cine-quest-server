import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	TCreateBookingPayload,
	TCreateCinemaPayload,
	TUpdateCinemaPayload,
} from "./cinema.interface";
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

const updateCinema = catchAsync(async (req, res) => {
	const cinema = await CinemaService.updateCinema(
		String(req.params.id),
		req.body as TUpdateCinemaPayload,
		req.file,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Cinema updated successfully.",
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

const createBooking = catchAsync(async (req, res) => {
	const booking = await CinemaService.createBooking(String(req.params.id), {
		groupSize: (req.body as TCreateBookingPayload).groupSize,
	});

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Booking created successfully.",
		data: booking,
	});
});

const deleteCinema = catchAsync(async (req, res) => {
	const cinema = await CinemaService.deleteCinema(String(req.params.id));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Cinema deleted successfully.",
		data: cinema,
	});
});

export const CinemaController = {
	createCinema,
	updateCinema,
	cinemaList,
	getBookingQuote,
	createBooking,
	deleteCinema,
};
