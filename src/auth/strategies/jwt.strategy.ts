import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entity/user.entity";
import { JwtPayload } from "../types/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

    constructor(
        configService: ConfigService,
        @InjectRepository(User) private userRepository: Repository<User>
    ) {
        super({
            secretOrKey: configService.get('JWT_ACCESS_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const { sub } = payload

        const user = await this.userRepository.findOneBy({ id: sub })

        if (!user) {
            throw new UnauthorizedException('Token not valid')
        }

        return user

    }

}