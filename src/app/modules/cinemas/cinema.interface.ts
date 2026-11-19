export type TCreateCinemaPayload = {
	name: string;
	bundleSizes: number[];
};

export type TUpdateCinemaPayload = Partial<TCreateCinemaPayload>;

export type TCreateBookingPayload = {
	groupSize: number;
};
