import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * DTO de răspuns pentru datele utilizatorului
 * Exclude câmpurile sensibile precum parola
 */
export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID-ul unic al utilizatorului',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Adresa de email a utilizatorului',
  })
  @Expose()
  email: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Numele utilizatorului',
  })
  @Expose()
  firstName: string | null;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Prenumele utilizatorului',
  })
  @Expose()
  lastName: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: 'URL-ul imaginii de profil',
  })
  @Expose()
  profileImage: string | null;

  @ApiProperty({
    example: 'USER',
    enum: Role,
    description: 'Rolul utilizatorului în sistem',
  })
  @Expose()
  rol: Role;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Data și ora creării contului',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Data și ora ultimei actualizări',
  })
  @Expose()
  updatedAt: Date;
}
