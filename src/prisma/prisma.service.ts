import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Serviciu Prisma pentru interacțiunea cu baza de date
 * Extinde PrismaClient și gestionează conexiunea la baza de date
 * Prisma Client citește automat variabilele de mediu din .env
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  /**
   * Inițializează conexiunea la baza de date la pornirea modulului
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Închide conexiunea la baza de date la oprirea modulului
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
