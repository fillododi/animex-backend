import { NextFunction, Request, RequestHandler, Response } from "express";
import z, { ZodTypeAny } from "zod";

type AnySchema = ZodTypeAny

type ValidatedRequest<TParams extends AnySchema | undefined, TQuery extends AnySchema | undefined, TBody extends AnySchema | undefined> = Request<
    TParams extends AnySchema? z.infer<TParams>: any, any, TBody extends AnySchema? z.infer<TBody>: any, TQuery extends AnySchema? z.infer<TQuery>: any
>

export function validatedRoute<TParams extends AnySchema | undefined, TQuery extends AnySchema | undefined, TBody extends AnySchema | undefined>(
    schemas: { params?: TParams, query?: TQuery, body?: TBody }, 
    handler: (req: ValidatedRequest<TParams, TQuery, TBody>, res: Response, next: NextFunction) => unknown
): RequestHandler {
    return (req, res, next) => {
        try {
            if(schemas.params) req.params = schemas.params.parse(req.params) as any;
            if(schemas.query) req.query = schemas.query.parse(req.query) as any;
            if(schemas.body) req.body = schemas.body.parse(req.body);
            return handler(req as ValidatedRequest<TParams, TQuery, TBody>, res, next)
        } catch (err) {
            next(err)
        }
    }
}