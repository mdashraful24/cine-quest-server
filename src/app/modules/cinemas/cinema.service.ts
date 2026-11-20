import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { calculateBookingQuote } from "../../utils/bundle";
import { toBookingResponse } from "../bookings/booking.service";
import type {
	TCreateBookingPayload,
	TCreateCinemaPayload,
	TUpdateCinemaPayload,
} from "./cinema.interface";

const cinemaSelect = {
	id: true,
	name: true,
	createdAt: true,
	updatedAt: true,
	bundleSizes: { select: { seatCount: true }, orderBy: { seatCount: "asc" } },
} as const;

type TCinemaRecord = {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	bundleSizes: { seatCount: number }[];
};

const toCinemaResponse = (cinema: TCinemaRecord) => {
	const { bundleSizes, ...rest } = cinema;

	return {
		...rest,
		bundleSizes: bundleSizes.map((bundle) => bundle.seatCount),
	};
};

const createCinema = async (payload: TCreateCinemaPayload) => {
	const cinema = await prisma.cinema.create({
		data: {
			name: payload.name,
			bundleSizes: {
				create: payload.bundleSizes.map((seatCount) => ({ seatCount })),
			},
		},
		select: cinemaSelect,
	});

	return toCinemaResponse(cinema);
};

const updateCinema = async (id: string, payload: TUpdateCinemaPayload) => {
	const existing = await prisma.cinema.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!existing) {
		throw new AppError(httpStatus.NOT_FOUND, "Cinema not found.", "NOT_FOUND");
	}

	const cinema = await prisma.cinema.update({
		where: { id },
		data: {
			...(payload.name !== undefined ? { name: payload.name } : {}),
			...(payload.bundleSizes
				? {
						bundleSizes: {
							deleteMany: {},
							create: payload.bundleSizes.map((seatCount) => ({
								seatCount,
							})),
						},
					}
				: {}),
		},
		select: cinemaSelect,
	});

	return toCinemaResponse(cinema);
};

const cinemaList = async () => {
	const cinemas = await prisma.cinema.findMany({
		select: cinemaSelect,
		orderBy: { createdAt: "desc" },
	});

	return cinemas.map(toCinemaResponse);
};

const getBookingQuote = async (id: string, groupSize: number) => {
	const cinema = await prisma.cinema.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			bundleSizes: {
				select: { seatCount: true },
				orderBy: { seatCount: "asc" },
			},
		},
	});

	if (!cinema) {
		throw new AppError(httpStatus.NOT_FOUND, "Cinema not found.", "NOT_FOUND");
	}

	const quote = calculateBookingQuote(
		groupSize,
		cinema.bundleSizes.map((bundle) => bundle.seatCount),
	);

	return {
		cinemaId: cinema.id,
		cinemaName: cinema.name,
		...quote,
	};
};

const createBooking = async (id: string, payload: TCreateBookingPayload) => {
	const quote = await getBookingQuote(id, payload.groupSize);

	if (!quote.possible) {
		throw new AppError(
			httpStatus.CONFLICT,
			quote.message ?? "No exact bundle combination is possible.",
			"BOOKING_NOT_POSSIBLE",
		);
	}

	const booking = await prisma.booking.create({
		data: {
			cinemaId: quote.cinemaId,
			groupSize: quote.groupSize,
			totalBundles: quote.totalBundles,
			bundles: quote.bundles,
		},
		select: {
			id: true,
			cinemaId: true,
			groupSize: true,
			totalBundles: true,
			bundles: true,
			status: true,
			createdAt: true,
			updatedAt: true,
			cinema: { select: { name: true } },
		},
	});

	return toBookingResponse(booking);
};

const deleteCinema = async (id: string) => {
	const cinema = await prisma.cinema.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!cinema) {
		throw new AppError(httpStatus.NOT_FOUND, "Cinema not found.", "NOT_FOUND");
	}

	await prisma.cinema.delete({ where: { id } });

	return { id };
};

export const CinemaService = {
	createCinema,
	updateCinema,
	cinemaList,
	getBookingQuote,
	createBooking,
	deleteCinema,
};
