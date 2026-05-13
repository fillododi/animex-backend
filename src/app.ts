import express from "express"
import helmet from "helmet";
import cors from "cors";

import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health.routes";
import { requestIdMiddleware } from "./middleware/requestId";
import { v1Router } from "./routes/v1.routes";
import { httpLogger } from "./middleware/httpLogger";
import { corsOptions } from "./config/cors";

export function createApp() {
    const app = express();

    app.disable("x-powered-by")
    app.use(express.json({ limit: "4mb" }))
    app.use(helmet())
    

    app.use(requestIdMiddleware)
    app.use(cors(corsOptions))

    app.use(httpLogger)

    app.use(healthRouter)
    app.use("/api/v1", v1Router)

    app.use(notFoundHandler);
    app.use(errorHandler);
    
    return app
}