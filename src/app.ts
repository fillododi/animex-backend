import express from "express"
import helmet from "helmet";
import cors from "cors";

import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health.routes";
import { requestIdMiddleware } from "./middleware/requestId";

export function createApp() {
    const app = express();

    app.disable("x-powered-by")
    app.use(express.json())
    app.use(helmet())
    app.use(cors())

    app.use(requestIdMiddleware)

    app.use("", healthRouter)

    app.use(notFoundHandler);
    app.use(errorHandler);
    
    return app
}