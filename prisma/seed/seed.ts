import { prisma } from "../../src/app/lib/prisma";
import logger from "../../src/app/logger";
import { demoCinemas, demoMovies } from "./seed.demo.data";

export const seedDatabase = async () => {
	const movieIds = new Map<string, string>();

	for (const movie of demoMovies) {
		const record = await prisma.movie.upsert({
			where: { title: movie.title },
			update: {
				releaseYear: movie.releaseYear,
				runtimeMinutes: movie.runtimeMinutes,
				watched: movie.watched,
			},
			create: {
				title: movie.title,
				releaseYear: movie.releaseYear,
				runtimeMinutes: movie.runtimeMinutes,
				watched: movie.watched,
			},
			select: { id: true },
		});

		movieIds.set(movie.title, record.id);
	}

	await prisma.moviePrerequisite.deleteMany();

	const prerequisites = demoMovies.flatMap((movie) =>
		movie.prerequisites.map((title) => {
			const movieId = movieIds.get(movie.title);
			const prerequisiteId = movieIds.get(title);

			if (!movieId || !prerequisiteId) {
				throw new Error(`Missing seed movie reference: ${title}`);
			}

			return { movieId, prerequisiteId };
		}),
	);

	if (prerequisites.length > 0) {
		await prisma.moviePrerequisite.createMany({ data: prerequisites });
	}

	for (const cinema of demoCinemas) {
		const record = await prisma.cinema.upsert({
			where: { name: cinema.name },
			update: {},
			create: { name: cinema.name },
			select: { id: true },
		});

		await prisma.cinemaBundleSize.deleteMany({
			where: { cinemaId: record.id },
		});

		await prisma.cinemaBundleSize.createMany({
			data: cinema.bundleSizes.map((seatCount) => ({
				cinemaId: record.id,
				seatCount,
			})),
		});
	}

	logger.info(
		`Seeded ${demoMovies.length} movies and ${demoCinemas.length} cinemas.`,
	);
};
