import app from "./app";
import config from "./app/config";
import logger from "./app/logger";
import { prisma } from "./app/lib/prisma";
import { isCloudinaryConfigured } from "./app/lib/cloudinary";
import { seedDatabase } from "../prisma/seed/seed";

const PORT = Number(config.port);
const NODE_ENV = config.node_env;

const main = async () => {
	try {
		await prisma.$connect();
		logger.info("Connected to the database successfully.");

		if (config.seed_on_start) {
			await seedDatabase();
		}

		if (isCloudinaryConfigured) {
			logger.info("Cloudinary image uploads are configured.");
		} else {
			logger.warn(
				"Cloudinary image uploads are disabled (missing CLOUDINARY_* environment variables).",
			);
		}

		const server = app.listen(PORT, () => {
			logger.info(
				`Server is running on port http://localhost:${PORT} (${NODE_ENV})`,
			);
		});

		let shuttingDown = false;

		const shutdown = (signal: string) => {
			if (shuttingDown) return;
			shuttingDown = true;

			logger.info(`${signal} received. Shutting down gracefully...`);

			const force = setTimeout(() => {
				logger.error("Forced shutdown after timeout.");
				process.exit(1);
			}, 10_000);
			force.unref();

			server.close(async (error) => {
				try {
					await prisma.$disconnect();

					if (error) {
						logger.error("Error while closing the HTTP server:", error);
						process.exit(1);
					}

					logger.info("Database disconnected. Exiting.");
					process.exit(0);
				} catch (shutdownError) {
					logger.error("Error during graceful shutdown:", shutdownError);
					process.exit(1);
				}
			});
		};

		process.on("SIGINT", () => shutdown("SIGINT"));
		process.on("SIGTERM", () => shutdown("SIGTERM"));

		process.on("unhandledRejection", (reason) => {
			logger.error("Unhandled Rejection:", reason);
		});

		process.on("uncaughtException", (error) => {
			logger.error("Uncaught Exception:", error);
			process.exit(1);
		});
	} catch (error) {
		logger.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
