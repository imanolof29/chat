import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatResolver } from './chat/chat.resolver';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ChatModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, ChatResolver],
})
export class AppModule {}
