import { logger } from "../config/logger";
import { Animal, MatchThresholds } from "../schemas/animal.schema";
import { normalizeVisionSignal, normalizeVisionText } from "../utils/normalizers";
import { catalogService } from "./catalog.service";
import { VisionSignal } from "./vision.service";

type WeightedAnimalRef = { animalId: string, weight: number }

type MatchScore = {
    animalId: string,
    score: number,
    matchedSignals: VisionSignal[]
}

type MatchResult = {
    animalId?: string,
    confidence: "LOW_CONFIDENCE" | "AMBIGUOUS" | "MATCHED_LOW_CERTAINTY" | "MATCHED"
}

export class AnimalMatcherService {
    private animalsById = new Map<string, Animal>()
    private aliasIndex = new Map<string, Set<string>>()
    private labelIndex = new Map<string, WeightedAnimalRef[]>()
    private webEntityIndex = new Map<string, WeightedAnimalRef[]>()
    private negativeLabelIndex = new Map<string, Set<string>>()
    private thresholdsByAnimalId = new Map<string, MatchThresholds>()

    private clearIndexes() {
        this.animalsById.clear()
        this.aliasIndex.clear()
        this.labelIndex.clear()
        this.webEntityIndex.clear()
        this.negativeLabelIndex.clear()
        this.thresholdsByAnimalId.clear()
    }

    rebuildIndexes() {
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
        logger.info({ animalId: animal.id }, "indexing animal")
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

    matchAnimal(visionSignals: VisionSignal[]): MatchResult {
        const normalizedSignals = visionSignals.map(signal => normalizeVisionSignal(signal))
        const scores: MatchScore[] = []
        for (const animal of this.animalsById.values()) {
            let score = 0
            let matchedSignals = []
            for (const signal of normalizedSignals) {
                if (this.aliasIndex.get(signal.text)?.has(animal.id)) {
                    score += signal.confidence
                    matchedSignals.push(signal)
                }
                const validLabels = this.labelIndex.get(signal.text)?.filter(label => label.animalId === animal.id) ?? []
                for (const label of validLabels) {
                    score += label.weight * signal.confidence
                    matchedSignals.push(signal)
                }
                const validWebEntities = this.webEntityIndex.get(signal.text)?.filter(entity => entity.animalId === animal.id) ?? []
                for (const entity of validWebEntities) {
                    score += entity.weight * signal.confidence
                    matchedSignals.push(signal)
                }
                if (this.negativeLabelIndex.get(signal.text)?.has(animal.id)) {
                    score -= signal.confidence * 0.6
                }
            }
            score = score / Math.max(1, matchedSignals.length)
            if (score <= 0) continue;
            logger.info({ animalId: animal.id, score, matchedSignals }, "animal match score")
            scores.push({ animalId: animal.id, score, matchedSignals })
        }
        scores.sort((a, b) => b.score - a.score)
        const top = scores[0]
        if(!top) return { confidence: "LOW_CONFIDENCE" }
        const second = scores[1]
        const thresholds = this.thresholdsByAnimalId.get(top.animalId)
        if(top.score < (thresholds?.minMatchScore ?? 0.6)) return { animalId: top.animalId, confidence: "LOW_CONFIDENCE" };
        if(second && top.score - second.score  < (thresholds?.ambiguityDelta ?? 0.1)) return { animalId: top.animalId, confidence: "AMBIGUOUS" };
        if(top.score >= (thresholds?.strongMatchScore ?? 0.9)) return { animalId: top.animalId, confidence: "MATCHED" };
        return { animalId: top.animalId, confidence: "MATCHED_LOW_CERTAINTY" }
    }
}

export const animalMatcherService = new AnimalMatcherService()