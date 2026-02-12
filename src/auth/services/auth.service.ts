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
   * Salvează refresh token-ul în baza de date
   * @param userId - ID-ul utilizatorului
   * @param refreshToken - Token-ul de refresh
   * @returns RefreshToken creat în baza de date
   */
  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresInSeconds = this.parseExpiresIn(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userId,
        expiresAt: expiresAt,
      },
    });
  }

  /**
   * Parsează string-ul de expirare (ex: "7d", "15m") în secunde
   * @param expiresIn - String de expirare
   * @returns Număr de secunde
   */
  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60;
      case 'h':
        return value * 60 * 60;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 7 * 24 * 60 * 60; // Default 7 zile
    }
  }

  /**
   * Șterge toate refresh token-urile unui utilizator
   * @param userId - ID-ul utilizatorului
   */
  private async deleteUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Șterge un refresh token specific din baza de date
   * @param refreshToken - Token-ul de refresh de șters
   */
  async deleteRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
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

    // Salvează refresh token-ul în baza de date
    await this.saveRefreshToken(user.id, refreshToken);

    // Transformă datele calendaristice în ISO 8601 string
    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      rol: user.rol,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    // Refresh token-ul va fi setat în cookie de controller, nu este returnat în body
    return {
      accessToken,
      user: userResponse,
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

    // Șterge toate refresh token-urile vechi ale utilizatorului (single session)
    await this.deleteUserRefreshTokens(user.id);

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);

    // Salvează noul refresh token în baza de date
    await this.saveRefreshToken(user.id, refreshToken);

    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      rol: user.rol,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      accessToken,
      user: userResponse,
      refreshToken, // Folosit intern de controller pentru a seta cookie-ul securizat
    };
  }

  /**
   * Reînnoiește access token-ul folosind refresh token-ul
   * Verifică token-ul în baza de date (sursa de adevăr)
   * @param refreshToken - Refresh token-ul pentru reînnoire
   * @returns Noul access token și refresh token
   * @throws UnauthorizedException dacă refresh token-ul este invalid sau nu există în baza de date
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verifică token-ul în baza de date (sursa de adevăr)
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token invalid sau expirat');
      }

      // Verifică dacă token-ul a expirat
      if (storedToken.expiresAt < new Date()) {
        // Șterge token-ul expirat
        await this.deleteRefreshToken(refreshToken);
        throw new UnauthorizedException('Refresh token expirat');
      }

      // Verifică dacă utilizatorul există
      if (!storedToken.user) {
        await this.deleteRefreshToken(refreshToken);
        throw new UnauthorizedException('Utilizatorul nu există');
      }

      // Verifică și validitatea token-ului JWT (pentru siguranță suplimentară)
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 
                            this.configService.get<string>('JWT_SECRET') || 
                            'your-refresh-secret-key-change-in-production';
      
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      }) as JwtPayload;

      // Verifică dacă payload-ul corespunde cu utilizatorul din baza de date
      if (payload.sub !== storedToken.userId) {
        await this.deleteRefreshToken(refreshToken);
        throw new UnauthorizedException('Refresh token invalid');
      }

      // Șterge vechiul refresh token (rotire token)
      await this.deleteRefreshToken(refreshToken);

      // Generează noi token-uri
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
      );

      // Salvează noul refresh token în baza de date
      await this.saveRefreshToken(storedToken.user.id, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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

    // Transformă datele calendaristice în ISO 8601 string
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      rol: user.rol,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
