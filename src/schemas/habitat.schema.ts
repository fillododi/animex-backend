import z from "zod"

export type Habitat = {
    id: string,
    displayName: string,
    summary: string,
    description: string,
    climate: string,
    mapRefs: string[],
    assets: {
        background?: string,
        ambientSound?: string,
        objects?: {
            id: string,
            label: string,
            asset: string
        }[],
        fallbackAsset?: string,
    },
    relatedAnimalIds: string[]
}

export const HabitatSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    displayName: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    description: z.string().trim().min(1),
    climate: z.string().trim().min(1),
    mapRefs: z.array(z.string().trim().min(1)),
    assets: z.object({
        background: z.string().trim().min(1).optional(),
        ambientSound: z.string().trim().min(1).optional(),
        objects: z.array(z.object({ 
            id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
            label: z.string().trim().min(1),
            asset: z.string().trim().min(1)
        })).optional(),
        fallbackAsset: z.string().trim().min(1).optional()
    }),
    relatedAnimalIds: z.array(z.string().trim().min(1))
})