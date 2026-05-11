import { Router } from "express";
import { versionRouter } from "./version.routes";
import { animalsRouter } from "./animals.routes";
import { visionRouter } from "./vision.routes";

const router = Router()

router.use("/version", versionRouter)
router.use("/animals", animalsRouter)
router.use("/vision", visionRouter)

export const v1Router = router