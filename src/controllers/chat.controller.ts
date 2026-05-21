import { Request, Response } from "express";
import { ChatBody } from "../schemas/chat.schema";
import { chatService } from "../services/chat.service";
import { success } from "../schemas/api.schema";
import { AppError } from "../middleware/errorHandler";

async function postChat(req: Request, res: Response) {
    const body: ChatBody = req.body
    body.message = normalizeUserMessage(body.message)
    const data = await chatService.answerQuestion(body)
    return res.status(200).json(success(req.requestId, { data }))
}

function normalizeUserMessage(message: string): string {
    const normalized = message.trim().replace(/\s+/g, ' ')
    if(!normalized) throw new AppError({ statusCode: 400, code: "VALIDATION_ERROR", message: "Message cannot be empty" });
    return normalized
}

export const chatController = { postChat }