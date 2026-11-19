import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import config from "./app/config";
import {
	globalErrorHandler,
	notFound,
} from "./app/middlewares/globalErrorHandler";
import { apiLimiter } from "./app/middlewares/rateLimit";

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

app.use(notFound);
app.use(globalErrorHandler);

export { apiPrefix };
export default app;
