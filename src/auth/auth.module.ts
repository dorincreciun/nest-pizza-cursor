/**
 * Modulul de Autentificare
 * 
 * Acest modul gestionează toate funcționalitățile legate de autentificare:
 * - Înregistrarea utilizatorilor noi
 * - Autentificarea utilizatorilor existenți
 * - Validarea token-urilor JWT
 * - Protecția rutelor cu Guards
 * 
 * Dependențe principale:
 * - PrismaService: pentru interacțiunea cu baza de date
 * - JwtModule: pentru generarea și validarea token-urilor JWT
 * - PassportModule: pentru strategia de autentificare JWT
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    CloudinaryModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PrismaService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
