import { NextFunction, RequestHandler, Request, Response } from "express";
import { AppError } from "./errorHandler";

export const notFoundHandler: RequestHandler = (
    _req: Request, _res: Response, _next: NextFunction
) => {
    _next(
        new AppError({
            statusCode: 404,
            code: "ROUTE_NOT_FOUND",
            message: `Cannot find ${_req.method} ${_req.path}`
        })
    )
}