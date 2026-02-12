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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../services/auth.service");
const register_dto_1 = require("../dto/register.dto");
const login_dto_1 = require("../dto/login.dto");
const update_profile_dto_1 = require("../dto/update-profile.dto");
const auth_response_dto_1 = require("../dto/auth-response.dto");
const user_response_dto_1 = require("../dto/user-response.dto");
const error_response_dto_1 = require("../../common/dto/error-response.dto");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const public_decorator_1 = require("../decorators/public.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto, res) {
        const result = await this.authService.register(registerDto);
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return {
            accessToken: result.accessToken,
            user: result.user,
        };
    }
    async login(loginDto, res) {
        const result = await this.authService.login(loginDto);
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return {
            accessToken: result.accessToken,
            user: result.user,
        };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token lipsă din cookie');
        }
        const tokens = await this.authService.refreshToken(refreshToken);
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        return {
            accessToken: tokens.accessToken,
        };
    }
    async logout(req, res) {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await this.authService.deleteRefreshToken(refreshToken);
        }
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', '', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 0,
            path: '/',
        });
        return {
            message: 'Deconectare reușită',
        };
    }
    async getMe(user) {
        return user;
    }
    async updateProfile(currentUser, updateProfileDto, file) {
        return await this.authService.updateProfile(currentUser.id, updateProfileDto, file);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Înregistrare utilizator nou',
        description: 'Creează un nou cont de utilizator cu email și parolă. Parola este hash-uită înainte de a fi salvată în baza de date. Refresh token-ul este setat în cookie.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Utilizator creat cu succes',
        schema: {
            type: 'object',
            properties: {
                data: {
                    $ref: (0, swagger_1.getSchemaPath)(auth_response_dto_1.AuthResponseDto),
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Date de validare invalide',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 400,
            message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
            error: 'Bad Request',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email-ul este deja înregistrat',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 409,
            message: 'Email-ul este deja înregistrat',
            error: 'Conflict',
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Autentificare utilizator',
        description: 'Autentifică un utilizator existent folosind email și parolă. Returnează access token în body și refresh token în cookie.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Autentificare reușită',
        schema: {
            type: 'object',
            properties: {
                data: {
                    $ref: (0, swagger_1.getSchemaPath)(auth_response_dto_1.AuthResponseDto),
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Date de validare invalide',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 400,
            message: ['email must be an email', 'password should not be empty'],
            error: 'Bad Request',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Email sau parolă incorectă',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 401,
            message: 'Email sau parolă incorectă',
            error: 'Unauthorized',
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reînnoire access token',
        description: 'Reînnoiește access token-ul folosind refresh token-ul din cookie (OBLIGATORIU). Refresh token-ul este securizat și trimis DOAR în cookie. Returnează un nou access token în body și actualizează refresh token-ul în cookie.',
    }),
    (0, swagger_1.ApiCookieAuth)('refreshToken'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Access token reînnoit cu succes',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Refresh token invalid, expirat sau lipsă din cookie',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 401,
            message: 'Refresh token invalid sau expirat',
            error: 'Unauthorized',
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Deconectare utilizator',
        description: 'Deconectează utilizatorul autentificat prin ștergerea cookie-ului cu refresh token. Access token-ul rămâne valid până la expirare, dar refresh token-ul este invalidat.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Deconectare reușită',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Deconectare reușită',
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Neautorizat - Token invalid sau lipsă',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 401,
            message: 'Token invalid sau expirat',
            error: 'Unauthorized',
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Preluare date utilizator curent',
        description: 'Returnează datele utilizatorului autentificat pe baza token-ului JWT din header.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Date utilizator returnate cu succes',
        schema: {
            type: 'object',
            properties: {
                data: {
                    $ref: (0, swagger_1.getSchemaPath)(user_response_dto_1.UserResponseDto),
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Neautorizat - Token invalid sau lipsă',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 401,
            message: 'Token invalid sau expirat',
            error: 'Unauthorized',
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_response_dto_1.UserResponseDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('profileImage', {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizare profil utilizator',
        description: 'Actualizează datele profilului utilizatorului autentificat. Toate câmpurile sunt opționale - poți actualiza doar ceea ce dorești (firstName, lastName, profileImage). Imaginea de profil va fi uploadată în Cloudinary.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                firstName: {
                    type: 'string',
                    example: 'John',
                    description: 'Numele utilizatorului',
                },
                lastName: {
                    type: 'string',
                    example: 'Doe',
                    description: 'Prenumele utilizatorului',
                },
                profileImage: {
                    type: 'string',
                    format: 'binary',
                    description: 'Imaginea de profil (JPG, PNG, max 5MB)',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profil actualizat cu succes',
        schema: {
            type: 'object',
            properties: {
                data: {
                    $ref: (0, swagger_1.getSchemaPath)(user_response_dto_1.UserResponseDto),
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Date de validare invalide sau eroare la upload-ul imaginii',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 400,
            message: [
                'firstName must be longer than or equal to 2 characters',
                'Dimensiunea fișierului nu poate depăși 5MB',
            ],
            error: 'Bad Request',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Neautorizat - Token invalid sau lipsă',
        type: error_response_dto_1.ErrorResponseDto,
        schema: {
            $ref: (0, swagger_1.getSchemaPath)(error_response_dto_1.ErrorResponseDto),
        },
        example: {
            statusCode: 401,
            message: 'Token invalid sau expirat',
            error: 'Unauthorized',
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_response_dto_1.UserResponseDto,
        update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Autentificare'),
    (0, swagger_1.ApiExtraModels)(error_response_dto_1.ErrorResponseDto, auth_response_dto_1.AuthResponseDto, user_response_dto_1.UserResponseDto, update_profile_dto_1.UpdateProfileDto),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map