import { Injectable, NotFoundException } from "@nestjs/common";
import { Message } from "../entities/message.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Chat } from "../entities/chat.entity";
import { SendMessageDto } from "../dto/send-message.dto";
import { User } from "src/auth/entity/user.entity";
import { MessageDto } from "../dto/message.dto";

@Injectable()
export class MessageService {

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ){}

    async getRecentMessages(chatId: string): Promise<MessageDto[]> {
        const messages = await this.messageRepository.find({
            order: { createdAt: 'DESC' },
            where: { id: chatId }
        })
        return messages.map((message) => ({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt
        }))
    }


    async sendMessage(
        userId: string,
        dto: SendMessageDto
    ): Promise<MessageDto> {
        const chat = await this.chatRepository.findOneBy({ id: dto.chatId });
        if(!chat) {
            throw new NotFoundException("Chat not found");
        }
        const user = await this.userRepository.findOneBy({ id: userId });
        if(!user){
            throw new NotFoundException("User not found");
        }
        const newMessage = await this.messageRepository.create({
            sender: user,
            content: dto.content
        })
        await this.messageRepository.save(newMessage);
        return {
            id: newMessage.id,
            content: newMessage.content,
            createdAt: newMessage.createdAt
        }
    }

}