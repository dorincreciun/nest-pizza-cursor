/**
 * Modulul de Produse
 *
 * Gestionează CRUD pentru produse. Produsele sunt legate de categorii.
 * GET list și GET :id sunt publice; create, update, delete doar pentru administratori.
 */
import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
