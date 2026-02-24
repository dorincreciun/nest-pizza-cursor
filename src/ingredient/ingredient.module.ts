/**
 * Modulul de Ingrediente
 *
 * CRUD pentru ingrediente (id, slug, name, imageUrl).
 * Un ingredient poate fi atașat la mai multe produse (many-to-many).
 * GET public; create/update/delete doar pentru admin.
 */
import { Module } from '@nestjs/common';
import { IngredientController } from './controllers/ingredient.controller';
import { IngredientService } from './services/ingredient.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IngredientController],
  providers: [IngredientService, PrismaService],
  exports: [IngredientService],
})
export class IngredientModule {}
