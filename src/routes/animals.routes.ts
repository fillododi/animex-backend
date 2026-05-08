import { Router } from "express";
import { animalsController } from "../controllers/animals.controller";
import z from "zod";
import { validatedRoute } from "../middleware/validate";

const router = Router()

const AnimalParamsSchema = z.object({ animalId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })

router.get("/", animalsController.listAnimals)

router.get("/:animalId", validatedRoute({ params: AnimalParamsSchema }, animalsController.getAnimalById))

export const animalsRouter = router