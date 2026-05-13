import { Animal, MatchThresholds } from "../schemas/animal.schema";
import { normalizeVisionText } from "../utils/normalizers";
import { catalogService } from "./catalog.service";

type WeightedAnimalRef = { animalId: string, weight: number }


export class AnimalMatcherService {
    private animalsById = new Map<string, Animal>()
    private aliasIndex = new Map<string, Set<string>>()
    private labelIndex = new Map<string, WeightedAnimalRef[]>()
    private webEntityIndex = new Map<string, WeightedAnimalRef[]>()
    private negativeLabelIndex = new Map<string, Set<string>>()
    private thresholdsByAnimalId = new Map<string, MatchThresholds>()

    constructor() {
        this.rebuildIndexes()
    }

    private clearIndexes() {
        this.animalsById.clear()
        this.aliasIndex.clear()
        this.labelIndex.clear()
        this.webEntityIndex.clear()
        this.negativeLabelIndex.clear()
        this.thresholdsByAnimalId.clear()
    }

    private rebuildIndexes() {
        this.clearIndexes()
        const animals = catalogService.getAnimals()
        for (const animal of animals) {
            this.indexAnimal(animal)
        }
    }

    private addAlias(rawAlias: string, animalId: string) {
        const key = normalizeVisionText(rawAlias)
        if(!key) return;
        const current = this.aliasIndex.get(key) ?? new Set<string>()
        current.add(animalId)
        this.aliasIndex.set(key, current)
    }

    private addWeightedValue(rawText: string, ref: WeightedAnimalRef, index: Map<string, WeightedAnimalRef[]>) {
        const key = normalizeVisionText(rawText)
        if(!key) return;
        const current = index.get(key) ?? []
        current.push(ref)
        index.set(key, current)
    }

    private addNegativeLabel(rawLabel: string, animalId: string) {
        const key = normalizeVisionText(rawLabel)
        if(!key) return;
        const current = this.negativeLabelIndex.get(key) ?? new Set<string>()
        current.add(animalId)
        this.negativeLabelIndex.set(key, current)
    }

    private indexAnimal(animal: Animal) {
        this.animalsById.set(animal.id, animal)
        this.addAlias(animal.displayName, animal.id)
        this.addAlias(animal.scientificName, animal.id)
        for (const alias of animal.aliases) {
            this.addAlias(alias, animal.id)
        }
        for (const label of animal.vision.supportedLabels) {
            this.addWeightedValue(label.name, { animalId: animal.id, weight: label.weight }, this.labelIndex)
            this.addAlias(label.name, animal.id)
        }
        for (const entity of animal.vision.supportedWebEntities) {
            this.addWeightedValue(entity.name, { animalId: animal.id, weight: entity.weight }, this.webEntityIndex)
            this.addAlias(entity.name, animal.id)
        }
        for (const label of animal.vision.negativeLabels) {
            this.addNegativeLabel(label, animal.id)
        }
        this.thresholdsByAnimalId.set(animal.id, animal.vision.thresholds)
    }
}