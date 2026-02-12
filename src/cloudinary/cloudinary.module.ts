import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';

/**
 * Modulul Cloudinary pentru gestionarea upload-ului de imagini
 * 
 * Acest modul gestionează toate operațiunile legate de Cloudinary:
 * - Upload de imagini cu transformări automate (resize, optimize)
 * - Ștergerea imaginilor din Cloudinary
 * - Validarea tipurilor și dimensiunilor de fișiere
 * 
 * Dependențe principale:
 * - ConfigService: pentru citirea credențialelor Cloudinary din variabilele de mediu
 * 
 * Exportă CloudinaryService pentru utilizare în alte module (ex: AuthModule)
 */
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
