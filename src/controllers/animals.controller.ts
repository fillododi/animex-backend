import { Request, Response } from "express";
import { catalogService } from "../services/catalog.service";
import { failure, success } from "../schemas/api.schema";

function listAnimals(req: Request, res: Response) {
    const animals = catalogService.getAnimals()
    const animalsMinimalData = animals.map(animal => ({ 
        id: animal.id, 
        displayName: 
        animal.displayName, 
        scientificName: animal.scientificName ,
        habitatIds: animal.habitat.habitatIds,
        diet: animal.diet
    }))
    return res.status(200).json(success(req.requestId, { animals: animalsMinimalData }))
}

function getAnimalById(req: Request<{ animalId: string }>, res: Response) {
    const animal = catalogService.getAnimalById(req.params.animalId)
    if(!animal) {
        return res.status(404).json(failure(req.requestId, { 
            code: "ANIMAL_NOT_FOUND", 
            message: "Could not find an animal", 
            details: { animalId: req.params.animalId } 
        }))
    }
    const animalData = {
        id: animal.id,
        displayName: animal.displayName,
        scientificName: animal.scientificName,
        ...(animal.taxonomicClass? { taxonomicClass: animal.taxonomicClass }: {}),
        habitat: animal.habitat,
        diet: animal.diet,
        facts: animal.facts,
        conservationStatus: animal.conservationStatus
    }
    return res.status(200).json(success(req.requestId, { animal: animalData }))
}

export const animalsController = { listAnimals, getAnimalById }