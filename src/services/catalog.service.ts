import path from "node:path"
import fs from "node:fs/promises"
import z from "zod"
import { Animal, AnimalSchema } from "../schemas/animal.schema"
import { Habitat, HabitatSchema } from "../schemas/habitat.schema"

interface Catalog<T> {
    loaded: boolean,
    items: T[],
    error?: string,
    loadedAt?: string
}

interface CatalogStatus {
    loaded: boolean,
    itemsLoaded: number,
    error?: string,
    loadedAt?: string
}

function createCatalog<T>(options: { dataDir: string, schema: z.ZodSchema<T> }) {
    let state: Catalog<T> = {
        loaded: false,
        items: []
    }

    async function load() {
        try {
            const files = await fs.readdir(options.dataDir)
            const jsonFiles = files.filter(file => file.endsWith(".json"))
            const items = await Promise.all(jsonFiles.map(async file => {
                const raw = await fs.readFile(path.join(options.dataDir, file), "utf8")
                const parsed = JSON.parse(raw)
                return options.schema.parse(parsed)
            }))
            state = {
                loaded: true,
                items,
                loadedAt: new Date().toISOString()
            }
        } catch (error) {
            state = {
                loaded: false,
                items: [],
                error: error instanceof Error? error.message: "Unknown catalog error"
            }
        }
        return state
    }
    
    function getStatus(): CatalogStatus {
        return {
            loaded: state.loaded,
            itemsLoaded: state.items.length,
            loadedAt: state.loadedAt,
            error: state.error
        }
    }

    function getItems() {
        return state.items
    }

    return { load, getStatus, getItems }
}

const animalCatalog = createCatalog<Animal>({
    dataDir: path.join(process.cwd(), "src", "data", "animals"),
    schema: AnimalSchema
})

const habitatCatalog = createCatalog<Habitat>({
    dataDir: path.join(process.cwd(), "src", "data", "habitats"),
    schema: HabitatSchema
})

export const loadAnimalCatalog = animalCatalog.load
export const getAnimalCatalogStatus = animalCatalog.getStatus
export const getAnimals = animalCatalog.getItems
export const loadHabitatCatalog = habitatCatalog.load
export const getHabitatCatalogStatus = habitatCatalog.getStatus
export const getHabitats = habitatCatalog.getItems