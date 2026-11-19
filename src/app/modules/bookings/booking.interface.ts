import type { BundleSelection } from "../../utils/bundle";

export type TBookingStatus = "CONFIRMED" | "CANCELLED";

export type TCreateBookingPayload = {
	groupSize: number;
};

export type TBookingResponse = {
	id: string;
	cinemaId: string;
	cinemaName: string;
	groupSize: number;
	totalBundles: number;
	bundles: BundleSelection[];
	status: TBookingStatus;
	createdAt: Date;
	updatedAt: Date;
};
