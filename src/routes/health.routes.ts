import { Router, Request, Response } from "express"

const router = Router()

router.get("/", (_req: Request, _res: Response) => {
    return _res.status(200).json({ ok: true, status: "live" })
})

module.exports = router