import { NextFunction, Request, Response } from "express";

export function asyncHandler(fn: (_req: Request, _res: Response, _next: NextFunction) => Promise<unknown>) {
    return (_req: Request, _res: Response, _next: NextFunction) => {
        Promise.resolve(fn(_req, _res, _next)).catch(_next)
    }
}