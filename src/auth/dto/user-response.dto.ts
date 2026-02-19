import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * DTO de răspuns pentru datele utilizatorului
 * Exclude câmpurile sensibile precum parola. Câmpurile nullable sunt mereu prezente în JSON (cu valoare sau null).
 */
export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID-ul unic al utilizatorului', required: true })
  @Expose()
  id: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Adresa de email a utilizatorului', required: true })
  @Expose()
  email: string;

  @ApiProperty({ example: 'John', description: 'Numele utilizatorului', required: true, nullable: true })
  @Expose()
  firstName: string | null;

  @ApiProperty({ example: 'Doe', description: 'Prenumele utilizatorului', required: true, nullable: true })
  @Expose()
  lastName: string | null;

  @ApiProperty({ example: 'https://example.com/profile.jpg', description: 'URL-ul imaginii de profil', required: true, nullable: true })
  @Expose()
  profileImage: string | null;

  @ApiProperty({ example: 'USER', enum: Role, description: 'Rolul utilizatorului în sistem', required: true })
  @Expose()
  rol: Role;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora creării contului (format ISO 8601)', type: String, required: true })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora ultimei actualizări (format ISO 8601)', type: String, required: true })
  @Expose()
  updatedAt: string;
}
