import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../dto/user-response.dto';

/**
 * Payload-ul JWT token-ului
 */
export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Strategie JWT pentru Passport
 * Validează token-urile JWT și returnează utilizatorul asociat
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  /**
   * Validează token-ul JWT și returnează utilizatorul
   * @param payload - Payload-ul decodat din token
   * @returns Datele utilizatorului validat
   * @throws UnauthorizedException dacă utilizatorul nu există
   */
  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilizatorul nu există');
    }

    return user;
  }
}
