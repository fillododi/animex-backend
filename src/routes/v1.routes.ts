import { Router } from "express";
import { versionRouter } from "./version.routes";
import { animalsRouter } from "./animals.routes";
import { visionRouter } from "./vision.routes";
import { chatRouter } from "./chat.routes";

const router = Router()

router.use("/version", versionRouter)
router.use("/animals", animalsRouter)
router.use("/vision", visionRouter)
router.use("/chat", chatRouter)

export const v1Router = router