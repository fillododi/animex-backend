import { z } from "zod"

export const AnimalSchema = z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    displayName: z.string().trim().min(1),
    scientificName: z.string().trim().min(1),
    taxonomicClass: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).min(1),
    vision: z.object({
        supportedLabels: z.array(z.object({ 
            name: z.string().trim().min(1),
            weight: z.coerce.number().min(0).max(1)
        })),
        supportedWebEntities: z.array(z.object({
            name: z.string().trim().min(1),
            weight: z.coerce.number().min(0).max(1)
        })),
        negativeLabels: z.array(z.string().trim().min(1)),
        thresholds: z.object({
            minMatchScore: z.coerce.number().min(0).max(1),
            strongMatchScore: z.coerce.number().min(0).max(1),
            ambiguityDelta: z.coerce.number().min(0).max(1)
        })
    }),
    habitat: z.object({
        primaryHabitatId: z.string().trim().min(1),
        habitatIds: z.array(z.string().trim().min(1)),
        summary: z.string().trim().min(1),
        climate: z.string().trim().min(1),
        mapRefs: z.array(z.string().trim().min(1))
    }),
    diet: z.object({
        type: z.enum([
            "herbivore", "carnivore", "omnivore", "insectivore", "piscivore", "unknown"
        ]),
        description: z.string().trim().min(1),
        examples: z.array(z.string().trim().min(1))
    }),
    facts: z.array(z.string().trim().min(1)).min(3),
    conservationStatus: z.enum(["EX", "EW", "CR", "EN", "VU", "NT", "LC"]),
    assets: z.object({
        thumbnail: z.string().trim().min(1).optional(),
        silhouette: z.string().trim().min(1).optional(),
        habitatBackground: z.string().trim().min(1).optional(),
        arObjects: z.array(z.string().trim().min(1)).optional()
    }),
    quiz: z.array(z.object({
        difficulty: z.enum(["easy", "medium", "hard"]),
        questions: z.array(z.object({
            id: z.string().trim().min(1),
            type: z.enum(["multiple_choice", "yes_no", "open_text"]),
            prompt: z.string().trim().min(1),
            choices: z.array(z.string().trim().min(1)).optional(),
            acceptedAnswers: z.array(z.string().trim().min(1)),
            feedback: z.string().trim().min(1),
            habitatRelated: z.boolean().optional()
        }))
    }))
})