import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CategoryStatus } from '@prisma/client';

/**
 * DTO de răspuns pentru o categorie
 * Frontend-ul poate folosi id, slug, name; status este pentru backend/admin
 */
export class CategoryResponseDto {
  @ApiProperty({ example: 1, description: 'ID-ul unic al categoriei', required: true })
  @Expose()
  id: number;

  @ApiProperty({ example: 'pizza-clasica', description: 'Slug-ul unic al categoriei (URL-friendly)', required: true })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Pizza Clasică', description: 'Numele categoriei', required: true })
  @Expose()
  name: string;

  @ApiProperty({ example: 'ACTIVE', enum: CategoryStatus, description: 'Statutul categoriei (activ/inactiv)', required: true })
  @Expose()
  status: CategoryStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora creării (format ISO 8601)', type: String, required: true })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora ultimei actualizări (format ISO 8601)', type: String, required: true })
  @Expose()
  updatedAt: string;
}
