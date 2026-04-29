import express from "express"

import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const healthz = require("./routes/health.routes")

const app = express();

app.use(express.json())

app.use("/healthz", healthz)

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app