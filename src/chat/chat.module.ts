import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { MessageService } from './services/message.service';
import { User } from 'src/auth/entity/user.entity';

@Module({
  controllers: [ChatController],
  providers: [ChatService, MessageService, ChatGateway],
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Chat, Message, User])
  ],
  exports: [ChatGateway]
})
export class ChatModule {}
