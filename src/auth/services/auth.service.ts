import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { AuthDto } from '../dto/auth-dto';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { PasswordService } from './password.service';
import { JwtPayload } from '../types/jwt-payload';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async signUpUser(dto: SignUpDto): Promise<AuthDto> {
        const emailExists = await this.userRepository.findOneBy({ email: dto.email });
        if(emailExists) {
            throw new ConflictException("Email already exists");
        }
        const usernameExists = await this.userRepository.findOneBy({ username: dto.username });
        if(usernameExists) {
            throw new ConflictException("Username already exists");
        }

        const hashPassword = await this.passwordService.hashPassword(dto.password);

        const newUser = await this.userRepository.create({
            username: dto.username,
            email: dto.email,
            password: hashPassword
        })
        await this.userRepository.save(newUser);
        return this.generateTokens(newUser);
    }

    async signInUser(dto: SignInDto): Promise<AuthDto> {
        const userExists = await this.userRepository.findOneBy({ email: dto.email });
        if(!userExists){
            throw new NotFoundException("User not found");
        }
        const passwordMatches = await this.passwordService.comparePasswords(dto.password, userExists.password);
        if(!passwordMatches) {
            throw new BadRequestException("Password does not match");
        }
        return await this.generateTokens(userExists);
    }

     private async generateTokens(
        user: User
    ): Promise<AuthDto> {
        const accessPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            type: 'access',
        };

        const refreshPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            type: 'refresh',
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
            }),
            this.jwtService.signAsync(refreshPayload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
            }),
        ]);

        return {
            accessToken,
            refreshToken
        };
    }

}
