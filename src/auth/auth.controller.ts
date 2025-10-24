import { Controller, Post } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { AuthDto } from './dto/auth-dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
@Public()
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  async signIn(dto: SignInDto): Promise<AuthDto> {
    return await this.authService.signInUser(dto);
  }

  @Post('sign-up')
  async signUp(dto: SignUpDto): Promise<AuthDto> {
    return await this.authService.signUpUser(dto);
  }

}
