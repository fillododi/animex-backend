import { RequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const notFoundHandler: RequestHandler = (req, res, next) => {
    next(
        new AppError({
            statusCode: 404,
            code: "ROUTE_NOT_FOUND",
            message: `Cannot find ${req.method} ${req.path}`
        })
    )
}