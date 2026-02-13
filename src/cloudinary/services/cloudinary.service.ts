import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { Express } from 'express';

/**
 * Serviciu pentru gestionarea operațiunilor Cloudinary
 * Responsabil pentru upload, ștergere și transformare imagini
 */
@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configurează Cloudinary cu credențialele din variabilele de mediu
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload o imagine în Cloudinary
   * Validează tipul și dimensiunea fișierului, apoi îl uploadă cu transformări automate
   * IMPORTANT: Fișierul trebuie să fie procesat cu Multer MemoryStorage pentru a avea buffer disponibil
   * @param file - Fișierul Express.Multer.File de uploadat (trebuie să aibă buffer din MemoryStorage)
   * @param folder - Folder-ul în Cloudinary unde se va stoca imaginea (opțional, default: 'nest-pizza/profiles')
   * @returns URL-ul securizat (HTTPS) al imaginii uploadate
   * @throws BadRequestException dacă validarea sau upload-ul eșuează
   */
  async uploadImage(file: Express.Multer.File, folder?: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('Fișierul este obligatoriu pentru upload');
    }

    // Verifică dacă fișierul are buffer (necesar pentru MemoryStorage)
    if (!file.buffer) {
      throw new BadRequestException(
        'Fișierul nu are buffer disponibil. Asigură-te că folosești MemoryStorage în Multer.',
      );
    }

    // Verifică dacă buffer-ul nu este gol
    if (file.buffer.length === 0) {
      throw new BadRequestException('Fișierul este gol');
    }

    // Verifică tipul fișierului - acceptă doar imagini
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException(
        'Tipul fișierului nu este suportat. Acceptă doar: JPG, PNG, WEBP, GIF',
      );
    }

    // Verifică dimensiunea fișierului (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Dimensiunea fișierului nu poate depăși 5MB');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        folder: folder || 'nest-pizza/profiles',
        resource_type: 'image',
        transformation: [
          {
            width: 500,
            height: 500,
            crop: 'limit', // Nu taie imaginea, doar redimensionează dacă este mai mare
            quality: 'auto', // Optimizează calitatea automat
            fetch_format: 'auto', // Convertește la format optim (WebP dacă browser-ul suportă)
          },
        ],
        // Folosește nume unic pentru a evita conflictele
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      };

      // Creează un stream din buffer-ul fișierului
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(
              new BadRequestException(
                `Eroare la upload-ul imaginii în Cloudinary: ${error.message}`,
              ),
            );
          } else if (result && result.secure_url) {
            // Returnează URL-ul securizat (HTTPS)
            resolve(result.secure_url);
          } else {
            reject(new BadRequestException('Eroare necunoscută la upload-ul imaginii'));
          }
        },
      );

      // Scrie buffer-ul în stream
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Șterge o imagine din Cloudinary pe baza URL-ului
   * Nu aruncă eroare dacă ștergerea eșuează (imaginea poate fi deja ștearsă sau URL-ul invalid)
   * @param imageUrl - URL-ul public al imaginii de șters
   * @returns Promise<void>
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      return;
    }

    try {
      // Extrage public_id din URL
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (!publicId) {
        return;
      }

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Nu aruncăm eroare dacă ștergerea eșuează (imaginea poate fi deja ștearsă sau URL-ul invalid)
      // Logăm doar pentru debugging
      console.warn(`Eroare la ștergerea imaginii din Cloudinary: ${error.message}`);
    }
  }

  /**
   * Extrage public_id din URL-ul Cloudinary
   * @param url - URL-ul public al imaginii
   * @returns public_id sau null dacă nu poate fi extras
   */
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Format URL Cloudinary: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}
