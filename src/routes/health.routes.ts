import { Router, Request, Response, NextFunction } from "express"
import { catalogService } from "../services/catalog.service"
import { visionService } from "../services/vision.service"
import { geminiService } from "../services/gemini.service"
import { failure, success } from "../schemas/api.schema"

const router = Router()

router.get("/healthz", (_req: Request, _res: Response) => {
    return _res.status(200).json({ ok: true, status: "live" })
})

router.get("/readyz", (_req: Request, _res: Response, _next: NextFunction) => {
    const animalCatalog = catalogService.getAnimalCatalogStatus()
    const habitatCatalog = catalogService.getHabitatCatalogStatus()
    const vision = visionService.getVisionStatus()
    const gemini = geminiService.getGeminiStatus()
    const ready = animalCatalog.loaded && 
        animalCatalog.itemsLoaded > 0 && 
        habitatCatalog.loaded &&
        habitatCatalog.itemsLoaded > 0 &&
        vision.visionConfigured && 
        gemini.geminiConfigured
    if(!ready) {
        return _res.status(503).json(failure(_req.requestId, {
            code: "SERVICE_UNAVAILABLE",
            message: "Backend is not ready",
            details: {
                animalCatalog,
                habitatCatalog,
                vision,
                gemini
            }
        }))
    }
    return _res.status(200).json(success(_req.requestId, { 
        ready: true, 
        animalsLoaded: animalCatalog.itemsLoaded,
        visionConfigured: true,
        geminiConfigured: true
    }))
})

export const healthRouter = router