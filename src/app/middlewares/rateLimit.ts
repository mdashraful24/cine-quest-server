import rateLimit from "express-rate-limit";
import httpStatus from "http-status";

export const apiLimiter = rateLimit({
	standardHeaders: "draft-8",
	legacyHeaders: false,
	windowMs: 15 * 60 * 1000,
	limit: 1000,
	handler: (_req, res) => {
		res.status(httpStatus.TOO_MANY_REQUESTS).json({
			success: false,
			statusCode: httpStatus.TOO_MANY_REQUESTS,
			code: "RATE_LIMITED",
			message: "Too many requests. Please try again later.",
		});
	},
});
