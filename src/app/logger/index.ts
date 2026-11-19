import { createLogger, format, transports } from "winston";
import config from "../config";

const logFormat = format.combine(
	format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	format.errors({ stack: true }),
	format.splat(),
	format.json(),
);

const logger = createLogger({
	level: config.node_env === "production" ? "info" : "debug",
	format: logFormat,
	defaultMeta: { service: "cine-quest-server" },
	transports: [
		new transports.Console({
			format:
				config.node_env === "development"
					? format.combine(
							format.colorize(),
							format.printf(
								({ level, message, timestamp, stack }) =>
									`${timestamp} [${level}]: ${stack || message}`,
							),
						)
					: logFormat,
		}),
	],
});

export default logger;
