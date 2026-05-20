import { Request, Response } from "express";
import { ChatBody } from "../schemas/chat.schema";
import { chatService } from "../services/chat.service";
import { success } from "../schemas/api.schema";

async function postChat(req: Request, res: Response) {
    const body: ChatBody = req.body
    const data = await chatService.answerQuestion(body)
    return res.status(200).json(success(req.requestId, { data }))
}

export const chatController = { postChat }