import { Router } from "express";
import { versionRouter } from "./version.routes";
import { animalsRouter } from "./animals.routes";

const router = Router()

router.use("/version", versionRouter)
router.use("/animals", animalsRouter)

export const v1Router = router