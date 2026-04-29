import path from "node:path"
import fs from "node:fs/promises"
import { AnimalSchema, type Animal } from "../schemas/animal.schema"

type CatalogState = {
    loaded: boolean,
    animals: Animal[],
    error?: string,
    loadedAt?: string
}

let state: CatalogState = {
    loaded: false,
    animals: []
}

export async function loadAnimalCatalog() {
    try {
        const animalsDir = path.join(process.cwd(), "src", "data", "animals")
        const files = await fs.readdir(animalsDir)
        const jsonFiles = files.filter(file => file.endsWith(".json"))
        const animals = await Promise.all(jsonFiles.map(async file => {
            const raw = await fs.readFile(path.join(animalsDir, file), "utf-8")
            const parsed = JSON.parse(raw)
            return AnimalSchema.parse(parsed)
        }))
        state = {
            loaded: true,
            animals,
            loadedAt: new Date().toISOString()
        }
    } catch (error) {
        state = {
            loaded: false,
            animals: [],
            error: error instanceof Error? error.message: "Unknown catalog error"
        }
    }
    return state
}

export function getAnimalCatalogStatus() {
    return {
        loaded: state.loaded,
        animalsLoaded: state.animals.length,
        loadedAt: state.loadedAt,
        error: state.error
    }
}