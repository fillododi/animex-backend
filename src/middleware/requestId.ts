import { NextFunction, Request, Response } from "express";
import crypto from "node:crypto"

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(_req: Request, _res: Response, _next: NextFunction) {
    const incoming = _req.header("X-Request-Id")
    _req.requestId = incoming && incoming.trim().length > 0? 
        incoming: 
        `req_${crypto.randomUUID()}`
    _res.setHeader("X-Request-Id", _req.requestId)

    _next()
}