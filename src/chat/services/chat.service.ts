import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatDto } from '../dto/chat.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';

@Injectable()
export class ChatService {

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ){}
  
  async getChat(id: string): Promise<ChatDto> {
    const chat = await this.chatRepository.findOneBy({ id })
    if(!chat) {
      throw new NotFoundException("Chat not found")
    }
    return {
      id: chat.id,
      participants: chat.participants.map((participant) => ({
        id: participant.id,
        username: participant.username,
        avatarUrl: participant.avatarUrl
      })),
      createdAt: chat.createdAt
    }
  }

}
