import { ErrorCode } from "./ErrorCode";

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