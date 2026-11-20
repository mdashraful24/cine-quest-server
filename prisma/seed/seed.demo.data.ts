import type { SeedCinema, SeedMovie } from "./seed.types";

export const demoMovies: SeedMovie[] = [
	{
		title: "Iron Man",
		releaseYear: 2008,
		runtimeMinutes: 126,
		watched: false,
		prerequisites: [],
	},
	{
		title: "Captain America: The First Avenger",
		releaseYear: 2011,
		runtimeMinutes: 124,
		watched: false,
		prerequisites: [],
	},
	{
		title: "The Avengers",
		releaseYear: 2012,
		runtimeMinutes: 143,
		watched: false,
		prerequisites: ["Iron Man", "Captain America: The First Avenger"],
	},
	{
		title: "Captain America: Civil War",
		releaseYear: 2016,
		runtimeMinutes: 147,
		watched: false,
		prerequisites: ["The Avengers"],
	},
	{
		title: "Thor: Ragnarok",
		releaseYear: 2017,
		runtimeMinutes: 130,
		watched: false,
		prerequisites: [],
	},
	{
		title: "Avengers: Infinity War",
		releaseYear: 2018,
		runtimeMinutes: 149,
		watched: false,
		prerequisites: ["Captain America: Civil War", "Thor: Ragnarok"],
	},
	{
		title: "Avengers: Endgame",
		releaseYear: 2019,
		runtimeMinutes: 181,
		watched: false,
		prerequisites: ["Avengers: Infinity War"],
	},
	{
		title: "Avengers: Doomsday",
		releaseYear: 2026,
		runtimeMinutes: 120,
		watched: false,
		prerequisites: ["Avengers: Endgame"],
	},
];

export const demoCinemas: SeedCinema[] = [
	{
		name: "IMAX Central",
		bundleSizes: [1, 3, 4],
	},
	{
		name: "Cineplex Downtown",
		bundleSizes: [2, 5],
	},
	{
		name: "Premiere House",
		bundleSizes: [6, 9, 20],
	},
	{
		name: "Grand Hall",
		bundleSizes: [4, 6],
	},
];
