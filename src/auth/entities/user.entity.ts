import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * Entitate User pentru documentarea Swagger
 * Reprezintă structura utilizatorului returnat de API
 */
export class UserEntity {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID-ul unic al utilizatorului',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Adresa de email a utilizatorului',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'Prenumele utilizatorului',
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'Numele de familie al utilizatorului',
  })
  lastName: string | null;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'URL-ul imaginii de profil',
  })
  profileImage: string | null;

  @ApiProperty({
    example: 'USER',
    enum: Role,
    description: 'Rolul utilizatorului în sistem',
  })
  rol: Role;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Data și ora creării contului',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Data și ora ultimei actualizări',
  })
  updatedAt: Date;
}
