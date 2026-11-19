import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import config from "./app/config";
import { apiLimiter } from "./app/middlewares/rateLimit";
import { BookingRoutes } from "./app/modules/bookings/booking.route";
import { CinemaRoutes } from "./app/modules/cinemas/cinema.route";
import { MovieRoutes } from "./app/modules/movies/movie.route";
import { notFound } from "./app/middlewares/notFound";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";

const app = express();

const apiPrefix = (() => {
	const raw = (config.api_prefix || "/api").trim();

	if (!raw || raw === "/") return "";

	return `/${raw.replace(/^\/+|\/+$/g, "")}`;
})();

const trustProxy = Number(config.trust_proxy);

if (Number.isFinite(trustProxy) && trustProxy > 0) {
	app.set("trust proxy", trustProxy);
}

app.disable("x-powered-by");

app.use(compression());
app.use(helmet());

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
		methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
	}),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/health", (_req, res) => {
	res.status(httpStatus.OK).json({
		success: true,
		statusCode: httpStatus.OK,
		message: "CineQuest API is running.",
		data: { uptime: Math.round(process.uptime()) },
	});
});

app.use(apiLimiter);
app.use(`${apiPrefix}/movies`, MovieRoutes);
app.use(`${apiPrefix}/cinemas`, CinemaRoutes);
app.use(`${apiPrefix}/bookings`, BookingRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export { apiPrefix };
export default app;
