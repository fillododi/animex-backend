import { pinoHttp } from "pino-http";
import { logger } from "../config/logger";

export const httpLogger = pinoHttp({
    logger,
    customProps: req => ({ requestId: req.headers["X-Request-Id"] }),
    redact: { 
        paths: [
            "req.headers.authorization", 
            "req.headers.cookie", 
            "req.body.imageBase64", 
            "req.body.apiKey",
            "res.headers.set-cookie"
        ],
        censor: "[REDACTED]",
    }
})