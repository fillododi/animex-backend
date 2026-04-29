import express, { Request, Response } from "express"
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(express.json())
app.get("/health", (_req: Request, _res: Response) => {
    _res.status(200).json({ ok: true });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app