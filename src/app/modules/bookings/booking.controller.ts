import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";

const bookingList = catchAsync(async (_req, res) => {
	const bookings = await BookingService.bookingList();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Bookings fetched successfully.",
		data: bookings,
	});
});

const cancelBooking = catchAsync(async (req, res) => {
	const booking = await BookingService.cancelBooking(String(req.params.id));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking cancelled successfully.",
		data: booking,
	});
});

const deleteBooking = catchAsync(async (req, res) => {
	const booking = await BookingService.deleteBooking(String(req.params.id));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Booking deleted successfully.",
		data: booking,
	});
});

export const BookingController = {
	bookingList,
	cancelBooking,
	deleteBooking,
};
