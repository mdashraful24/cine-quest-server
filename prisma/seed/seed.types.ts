export type SeedMovie = {
	title: string;
	releaseYear: number;
	runtimeMinutes: number;
	watched: boolean;
	prerequisites: string[];
};

export type SeedCinema = {
	name: string;
	bundleSizes: number[];
};
