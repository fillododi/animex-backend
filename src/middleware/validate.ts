import { NextFunction, Request, RequestHandler, Response } from "express";
import z, { ZodTypeAny } from "zod";
import { ParamsDictionary } from "express-serve-static-core"
import { ParsedQs } from "qs"

type AnySchema = ZodTypeAny
type InferOr<TSchema, TFallback> = TSchema extends AnySchema? z.infer<TSchema>: TFallback

type RequestParams<TParams> = InferOr<TParams, ParamsDictionary>
type RequestQuery<TQuery> = InferOr<TQuery, ParsedQs>
type RequestBody<TBody> = InferOr<TBody, ParamsDictionary>
type EmptyResponseBody = Record<string, ParamsDictionary>

type ValidatedRequest<TParams extends AnySchema | undefined, TQuery extends AnySchema | undefined, TBody extends AnySchema | undefined> = Request<
  RequestParams<TParams>,
  EmptyResponseBody,
  RequestBody<TBody>,
  RequestQuery<TQuery>
>

export function validatedRoute<
    TParams extends AnySchema | undefined = undefined, 
    TQuery extends AnySchema | undefined = undefined, 
    TBody extends AnySchema | undefined = undefined
>(
    schemas: { params?: TParams, query?: TQuery, body?: TBody }, 
    handler: (req: ValidatedRequest<TParams, TQuery, TBody>, res: Response, next: NextFunction) => unknown
): RequestHandler<RequestParams<TParams>, EmptyResponseBody, RequestBody<TBody>, RequestQuery<TQuery>> {
    return (req, res, next) => {
        try {
            if(schemas.params) req.params = schemas.params.parse(req.params) as RequestParams<TParams>;
            if(schemas.query) req.query = schemas.query.parse(req.query) as RequestParams<TQuery>;
            if(schemas.body) req.body = schemas.body.parse(req.body) as RequestParams<TBody>;
            return handler(req as ValidatedRequest<TParams, TQuery, TBody>, res, next)
        } catch (err) {
            next(err)
        }
    }
}