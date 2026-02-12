import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Modulul Prisma - Global
 * Exportă PrismaService pentru a fi disponibil în toate modulele aplicației
 * ConfigModule este deja global în AppModule, deci nu trebuie importat aici
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
