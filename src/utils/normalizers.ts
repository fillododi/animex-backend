export function normalizeVisionText(input: string): string {
    return input.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, " ");
}