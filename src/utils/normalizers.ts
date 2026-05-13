import { VisionSignal } from "../services/vision.service";

export function normalizeText(input: string): string {
    return input.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, " ");
}

export function normalizePlural(input: string): string {
    const scientificNamePattern = /^[a-z]+ [a-z]+$/i
    if (scientificNamePattern.test(input)) return input;
    return input.split(" ").map(word => {
        if (word.length <= 3) return word;
        if (word.endsWith("ies")) return word.slice(0, -3) + "y";
        if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1);
        return word
    }).join(" ")
}

export function normalizeVisionText(input: string): string {
    const normalized = normalizeText(input)
    return normalizePlural(normalized)
}

export function clamp01(input: number): number {
    return Math.max(0, Math.min(1, input))
}

export function normalizeVisionSignal(input: VisionSignal): VisionSignal {
    return {
        source: input.source,
        text: normalizeVisionText(input.text),
        confidence: clamp01(input.confidence),
        ...(input.boundingPoly? { boundingPoly: input.boundingPoly }: {})
    }
}