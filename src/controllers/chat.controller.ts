import { Request, Response } from "express";
import { ChatBody } from "../schemas/chat.schema";
import { chatService } from "../services/chat.service";
import { success } from "../schemas/api.schema";
import { AppError } from "../middleware/errorHandler";
import { GeminiMessage } from "../services/gemini.service";

async function postChat(req: Request, res: Response) {
    const body: ChatBody = req.body
    body.message = normalizeMessage(body.message)
    body.history = normalizeHistory(body.history)
    const data = await chatService.answerQuestion(body)
    return res.status(200).json(success(req.requestId, { data }))
}

function normalizeMessage(message: string): string {
    const normalized = message.trim().replace(/\s+/g, ' ')
    if(!normalized) throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Message cannot be empty" });
    return normalized
}

function normalizeHistory(history: GeminiMessage[]): GeminiMessage[] {
    return history.map<GeminiMessage>(turn => ({ role: turn.role, text: normalizeMessage(turn.text) }))
        .filter(turn => turn.text.trim().length > 0)
        .slice(-8)
}

export const chatController = { postChat }