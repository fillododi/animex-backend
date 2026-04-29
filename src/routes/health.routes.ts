import { Router, Request, Response } from "express"
import { loadAnimalCatalog } from "../services/animalCatalog.service"
import { AppError } from "../middleware/errorHandler"

const router = Router()

router.get("/healthz", (_req: Request, _res: Response) => {
    return _res.status(200).json({ ok: true, status: "live" })
})

export const healthRouter = router