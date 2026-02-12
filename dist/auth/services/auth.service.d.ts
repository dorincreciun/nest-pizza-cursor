import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    private generateTokens;
    private saveRefreshToken;
    private parseExpiresIn;
    private deleteUserRefreshTokens;
    deleteRefreshToken(refreshToken: string): Promise<void>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto & {
        refreshToken: string;
    }>;
    login(loginDto: LoginDto): Promise<AuthResponseDto & {
        refreshToken: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateUser(userId: string): Promise<UserResponseDto>;
}
