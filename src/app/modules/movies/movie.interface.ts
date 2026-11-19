export type TCreateMoviePayload = {
	title: string;
	releaseYear: number;
	runtimeMinutes: number;
	prerequisiteIds: string[];
};

export type TUpdateMoviePayload = {
	title?: string;
	releaseYear?: number;
	runtimeMinutes?: number;
	watched?: boolean;
	prerequisiteIds?: string[];
};

export type TMovieListQuery = {
	search?: string;
	watched?: boolean;
	page: number;
	limit: number;
};
