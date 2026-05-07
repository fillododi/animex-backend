import { CorsOptions } from "cors";
import { ENV } from "./env";
import { AppError } from "../middleware/errorHandler";

const allowedOrigins = ENV.CORS_ORIGINS

export const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if(!origin) return callback(null, true); //allow requests without origin header (e.g. postman)
        if(allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new AppError({ statusCode: 403, code: "CORS_ORIGIN_BLOCKED", message: "Origin is not allowed by CORS policy", details: { origin } }));
    },
    methods: ["GET, POST, OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Animex-Client", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"]
}