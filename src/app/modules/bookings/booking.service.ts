import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { BundleSelection } from "../../utils/bundle";
import type { TBookingResponse, TBookingStatus } from "./booking.interface";

const bookingSelect = {
	id: true,
	cinemaId: true,
	groupSize: true,
	totalBundles: true,
	bundles: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	cinema: { select: { name: true } },
} as const;

type TBookingRecord = {
	id: string;
	cinemaId: string;
	groupSize: number;
	totalBundles: number;
	bundles: unknown;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	cinema: { name: string };
};

export const toBookingResponse = (
	booking: TBookingRecord,
): TBookingResponse => {
	const { cinema, bundles, status, ...rest } = booking;

	return {
		...rest,
		cinemaName: cinema.name,
		bundles: bundles as BundleSelection[],
		status: status as TBookingStatus,
	};
};

const assertBookingExists = async (id: string) => {
	const booking = await prisma.booking.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.", "NOT_FOUND");
	}
};

const bookingList = async () => {
	const bookings = await prisma.booking.findMany({
		select: bookingSelect,
		orderBy: { createdAt: "desc" },
	});

	return bookings.map(toBookingResponse);
};

const cancelBooking = async (id: string) => {
	const booking = await prisma.booking.findUnique({
		where: { id },
		select: bookingSelect,
	});

	if (!booking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking not found.", "NOT_FOUND");
	}

	if (booking.status === "CANCELLED") {
		return toBookingResponse(booking);
	}

	const cancelled = await prisma.booking.update({
		where: { id },
		data: { status: "CANCELLED" },
		select: bookingSelect,
	});

	return toBookingResponse(cancelled);
};

const deleteBooking = async (id: string) => {
	await assertBookingExists(id);
	await prisma.booking.delete({ where: { id } });

	return { id };
};

export const BookingService = {
	bookingList,
	cancelBooking,
	deleteBooking,
};
