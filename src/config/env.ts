import { z } from "zod"
import dotenv from "dotenv"

dotenv.config()

const envSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    CORS_ORIGINS: z.string()
        .default("http://localhost:5173")
        .transform(value => value.split(",").map(origin => origin.trim()).filter(Boolean))
        .pipe(z.array(z.url())),
    GOOGLE_CLOUD_VISION_API_KEY: z.string()
        .trim()
        .min(1, "GOOGLE_CLOUD_VISION_API_KEY is required"),
    GEMINI_API_KEY: z.string().trim().min(1, "GEMINI_API_KEY is required"),
    VISION_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
    GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
    MAX_IMAGE_BYTES: z.coerce.number().int().min(1).max(4*1024*1024).default(3145728),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info")
})

type Env = z.infer<typeof envSchema>

export const ENV: Env = envSchema.parse(process.env)