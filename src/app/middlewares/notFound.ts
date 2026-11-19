import type { Request, Response } from "express";
import httpStatus from "http-status";

export const notFound = (req: Request, res: Response) => {
	res.status(httpStatus.NOT_FOUND).json({
		success: false,
		statusCode: httpStatus.NOT_FOUND,
		code: "NOT_FOUND",
		message: `Route ${req.method} ${req.originalUrl} was not found.`,
	});
};
