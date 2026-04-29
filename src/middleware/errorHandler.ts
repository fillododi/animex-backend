import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const isDevelopment = process.env.NODE_ENV === "development";

    if(err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(isDevelopment && err.details ? { details: err.details } : {})
            }
        })
    }

    console.error("Unexpected error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    })

    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Something went wrong",
            ...(isDevelopment ? { details: { message: err.message, stack: err.stack } } : {})
        }
    })
}