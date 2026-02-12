import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiExtraModels,
  ApiConsumes,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';

/**
 * Controller pentru gestionarea autentificării utilizatorilor
 * Oferă endpoint-uri pentru înregistrare, autentificare și preluarea datelor utilizatorului curent
 */
@ApiTags('Autentificare')
@ApiExtraModels(ErrorResponseDto, AuthResponseDto, UserResponseDto, UpdateProfileDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Înregistrare utilizator nou',
    description:
      'Creează un nou cont de utilizator cu email și parolă. Parola este hash-uită înainte de a fi salvată în baza de date. Refresh token-ul este setat în cookie.',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilizator creat cu succes',
    schema: {
      type: 'object',
      properties: {
        data: {
          $ref: getSchemaPath(AuthResponseDto),
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 400,
      message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email-ul este deja înregistrat',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 409,
      message: 'Email-ul este deja înregistrat',
      error: 'Conflict',
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(registerDto);

    // Setează refresh token în cookie securizat (DOAR în cookie, nu în body)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Previne accesul JavaScript la cookie
      secure: isProduction, // HTTPS only în production
      sameSite: isProduction ? 'strict' : 'lax', // Protecție CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 zile
      path: '/', // Disponibil pentru toate rutele
    });

    // Returnează doar accessToken și user (fără refreshToken în body)
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentificare utilizator',
    description:
      'Autentifică un utilizator existent folosind email și parolă. Returnează access token în body și refresh token în cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autentificare reușită',
    schema: {
      type: 'object',
      properties: {
        data: {
          $ref: getSchemaPath(AuthResponseDto),
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 400,
      message: ['email must be an email', 'password should not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email sau parolă incorectă',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 401,
      message: 'Email sau parolă incorectă',
      error: 'Unauthorized',
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    // Setează refresh token în cookie securizat (DOAR în cookie, nu în body)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, // Previne accesul JavaScript la cookie
      secure: isProduction, // HTTPS only în production
      sameSite: isProduction ? 'strict' : 'lax', // Protecție CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 zile
      path: '/', // Disponibil pentru toate rutele
    });

    // Returnează doar accessToken și user (fără refreshToken în body)
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reînnoire access token',
    description:
      'Reînnoiește access token-ul folosind refresh token-ul din cookie (OBLIGATORIU). Refresh token-ul este securizat și trimis DOAR în cookie. Returnează un nou access token în body și actualizează refresh token-ul în cookie.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid, expirat sau lipsă din cookie',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 401,
      message: 'Refresh token invalid sau expirat',
      error: 'Unauthorized',
    },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    // Citește refresh token DOAR din cookie (securizat)
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token lipsă din cookie');
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    // Setează noul refresh token în cookie securizat
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, // Previne accesul JavaScript la cookie
      secure: isProduction, // HTTPS only în production
      sameSite: isProduction ? 'strict' : 'lax', // Protecție CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 zile
      path: '/', // Disponibil pentru toate rutele
    });

    // Returnează doar accessToken (refreshToken este DOAR în cookie)
    return {
      accessToken: tokens.accessToken,
    };
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deconectare utilizator',
    description:
      'Deconectează utilizatorul autentificat prin ștergerea cookie-ului cu refresh token. Access token-ul rămâne valid până la expirare, dar refresh token-ul este invalidat.',
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 401,
    description: 'Neautorizat - Token invalid sau lipsă',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 401,
      message: 'Token invalid sau expirat',
      error: 'Unauthorized',
    },
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // Citește refresh token din cookie
    const refreshToken = req.cookies?.refreshToken;

    // Șterge refresh token-ul din baza de date dacă există
    if (refreshToken) {
      await this.authService.deleteRefreshToken(refreshToken);
    }

    // Șterge cookie-ul cu refresh token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 0, // Expiră imediat
      path: '/',
    });

    return {
      message: 'Deconectare reușită',
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Preluare date utilizator curent',
    description:
      'Returnează datele utilizatorului autentificat pe baza token-ului JWT din header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Date utilizator returnate cu succes',
    schema: {
      type: 'object',
      properties: {
        data: {
          $ref: getSchemaPath(UserResponseDto),
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Neautorizat - Token invalid sau lipsă',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 401,
      message: 'Token invalid sau expirat',
      error: 'Unauthorized',
    },
  })
  async getMe(@CurrentUser() user: UserResponseDto): Promise<UserResponseDto> {
    return user;
  }

  @Patch('profile')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizare profil utilizator',
    description:
      'Actualizează datele profilului utilizatorului autentificat. Toate câmpurile sunt opționale - poți actualiza doar ceea ce dorești (firstName, lastName, profileImage). Imaginea de profil va fi uploadată în Cloudinary.',
  })
  @ApiBody({
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
  })
  @ApiResponse({
    status: 200,
    description: 'Profil actualizat cu succes',
    schema: {
      type: 'object',
      properties: {
        data: {
          $ref: getSchemaPath(UserResponseDto),
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide sau eroare la upload-ul imaginii',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 400,
      message: [
        'firstName must be longer than or equal to 2 characters',
        'Dimensiunea fișierului nu poate depăși 5MB',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Neautorizat - Token invalid sau lipsă',
    type: ErrorResponseDto,
    schema: {
      $ref: getSchemaPath(ErrorResponseDto),
    },
    example: {
      statusCode: 401,
      message: 'Token invalid sau expirat',
      error: 'Unauthorized',
    },
  })
  async updateProfile(
    @CurrentUser() currentUser: UserResponseDto,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return await this.authService.updateProfile(currentUser.id, updateProfileDto, file);
  }
}
