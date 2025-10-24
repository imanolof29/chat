import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { PasswordService } from './services/password.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
  imports: [
    TypeOrmModule.forFeature([User])
  ]
})
export class AuthModule {}
