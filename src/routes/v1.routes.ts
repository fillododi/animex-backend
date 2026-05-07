import { Router } from "express";
import { versionRouter } from "./version.routes";

const router = Router()

router.use("/version", versionRouter)

export const v1Router = router