import type { ErrorRequestHandler, RequestHandler } from "express";
import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";

const prismaErrorDetails = (error: unknown) => {
	if (!(error instanceof Error)) return null;
	if (!error.name.startsWith("PrismaClient")) return null;

	const code =
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as { code?: unknown }).code === "string"
			? (error as { code: string }).code
			: undefined;

	return { name: error.name, code };
};

export const globalErrorHandler: ErrorRequestHandler = (
	err,
	_req,
	res,
	_next,
) => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let message = "Something went wrong. Please try again.";
	let code: string | undefined;

	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		code = err.code;
	} else {
		const prismaError = prismaErrorDetails(err);

		if (prismaError?.code === "P2002") {
			statusCode = httpStatus.CONFLICT;
			message = "A resource with these details already exists.";
			code = "DUPLICATE_RESOURCE";
		} else if (prismaError?.code === "P2025") {
			statusCode = httpStatus.NOT_FOUND;
			message = "The requested resource was not found.";
			code = "NOT_FOUND";
		} else if (prismaError?.name === "PrismaClientValidationError") {
			statusCode = httpStatus.BAD_REQUEST;
			message = "Invalid data was provided.";
			code = "VALIDATION_ERROR";
		} else if (
			err instanceof SyntaxError &&
			(err as { body?: unknown }).body !== undefined
		) {
			statusCode = httpStatus.BAD_REQUEST;
			message = "Invalid JSON payload.";
			code = "VALIDATION_ERROR";
		} else if (err instanceof Error) {
			console.error(err);

			if (config.node_env !== "production") {
				message = err.message;
			}
		}
	}

	res.status(statusCode).json({
		success: false,
		statusCode,
		...(code ? { code } : {}),
		message,
	});
};

export const notFound: RequestHandler = (req, res) => {
	res.status(httpStatus.NOT_FOUND).json({
		success: false,
		statusCode: httpStatus.NOT_FOUND,
		code: "NOT_FOUND",
		message: `Route ${req.method} ${req.originalUrl} was not found.`,
	});
};
