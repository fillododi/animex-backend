import { ErrorRequestHandler } from "express";
import { ENV } from "../config/env";

type ErrorCode = "ROUTE_NOT_FOUND";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly details?: unknown;

    constructor(params: { statusCode: number; code: ErrorCode; message: string; details?: unknown }) {
        super(params.message);
        this.statusCode = params.statusCode;
        this.code = params.code;
        this.details = params.details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const isDevelopment = ENV.NODE_ENV === "development";

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