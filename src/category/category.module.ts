/**
 * Modulul de Categorii
 *
 * Gestionează CRUD pentru categorii (versiune de test).
 * Categoriile au status activ/inactiv și vor fi atașate produselor ulterior.
 * Poate fi șters sau refăcut la nevoie.
 */
import { Module } from '@nestjs/common';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService],
  exports: [CategoryService],
})
export class CategoryModule {}
