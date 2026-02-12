import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../strategies/jwt.strategy';

/**
 * Serviciu pentru gestionarea autentificării utilizatorilor
 * Responsabil pentru înregistrare, autentificare și validare utilizatori
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generează access token și refresh token pentru un utilizator
   * @param userId - ID-ul unic al utilizatorului din baza de date
   * @param email - Adresa de email a utilizatorului
   * @returns Obiect cu accessToken și refreshToken generat
   */
  private generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET') || 'your-refresh-secret-key-change-in-production',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Înregistrează un nou utilizator în sistem
   * Hash-uiește parola înainte de a o salva în baza de date
   * @param registerDto - Datele pentru înregistrare (email, password)
   * @returns Datele utilizatorului creat, access token și refresh token (pentru cookie)
   * @throws ConflictException dacă email-ul există deja
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto & { refreshToken: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email-ul este deja înregistrat');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: null,
        lastName: null,
        profileImage: null,
      },
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

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);

    // Refresh token-ul va fi setat în cookie de controller, nu este returnat în body
    return {
      accessToken,
      user,
      refreshToken, // Folosit intern de controller pentru a seta cookie-ul
    };
  }

  /**
   * Autentifică un utilizator existent
   * Validează email-ul și parola, apoi generează token-uri JWT
   * @param loginDto - Datele pentru autentificare (email, password)
   * @returns Datele utilizatorului, access token și refresh token (pentru cookie)
   * @throws UnauthorizedException dacă email-ul sau parola sunt incorecte
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto & { refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);

    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      rol: user.rol,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      accessToken,
      user: userResponse,
      refreshToken, // Folosit intern de controller pentru a seta cookie-ul securizat
    };
  }

  /**
   * Reînnoiește access token-ul folosind refresh token-ul
   * @param refreshToken - Refresh token-ul pentru reînnoire
   * @returns Noul access token și refresh token
   * @throws UnauthorizedException dacă refresh token-ul este invalid
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 
                            this.configService.get<string>('JWT_SECRET') || 
                            'your-refresh-secret-key-change-in-production';
      
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      }) as JwtPayload;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Utilizatorul nu există');
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalid sau expirat');
    }
  }

  /**
   * Validează un utilizator pentru Passport Strategy
   * Folosit de JwtStrategy pentru a verifica existența utilizatorului
   * @param userId - ID-ul utilizatorului din token-ul JWT
   * @returns Datele utilizatorului validat
   * @throws UnauthorizedException dacă utilizatorul nu există
   */
  async validateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
