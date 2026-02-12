"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    generateTokens(userId, email) {
        const payload = {
            sub: userId,
            email: email,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET') || 'your-refresh-secret-key-change-in-production',
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });
        return { accessToken, refreshToken };
    }
    async saveRefreshToken(userId, refreshToken) {
        const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
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
    parseExpiresIn(expiresIn) {
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
                return 7 * 24 * 60 * 60;
        }
    }
    async deleteUserRefreshTokens(userId) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async deleteRefreshToken(refreshToken) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async register(registerDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email-ul este deja înregistrat');
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
        await this.saveRefreshToken(user.id, refreshToken);
        const userResponse = {
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
            refreshToken,
        };
    }
    async login(loginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Email sau parolă incorectă');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email sau parolă incorectă');
        }
        await this.deleteUserRefreshTokens(user.id);
        const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);
        await this.saveRefreshToken(user.id, refreshToken);
        const userResponse = {
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
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        try {
            const storedToken = await this.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!storedToken) {
                throw new common_1.UnauthorizedException('Refresh token invalid sau expirat');
            }
            if (storedToken.expiresAt < new Date()) {
                await this.deleteRefreshToken(refreshToken);
                throw new common_1.UnauthorizedException('Refresh token expirat');
            }
            if (!storedToken.user) {
                await this.deleteRefreshToken(refreshToken);
                throw new common_1.UnauthorizedException('Utilizatorul nu există');
            }
            const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') ||
                this.configService.get('JWT_SECRET') ||
                'your-refresh-secret-key-change-in-production';
            const payload = this.jwtService.verify(refreshToken, {
                secret: refreshSecret,
            });
            if (payload.sub !== storedToken.userId) {
                await this.deleteRefreshToken(refreshToken);
                throw new common_1.UnauthorizedException('Refresh token invalid');
            }
            await this.deleteRefreshToken(refreshToken);
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(storedToken.user.id, storedToken.user.email);
            await this.saveRefreshToken(storedToken.user.id, newRefreshToken);
            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Refresh token invalid sau expirat');
        }
    }
    async validateUser(userId) {
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
            throw new common_1.UnauthorizedException('Utilizatorul nu există');
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map