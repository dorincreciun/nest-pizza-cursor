import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ProductType, ItemStatus } from '@prisma/client';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';

/**
 * DTO de răspuns pentru un produs
 * Toate câmpurile sunt definite explicit; cele nullable folosesc tip | null, fără ?
 */
export class ProductResponseDto {
  @ApiProperty({ example: 1, description: 'ID-ul unic al produsului', required: true })
  @Expose()
  id: number;

  @ApiProperty({ example: 'margherita', description: 'Slug-ul unic al produsului (URL-friendly)', required: true })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Pizza Margherita', description: 'Numele produsului', required: true })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Pizza clasică cu roșii și mozzarella',
    description: 'Descrierea produsului',
    required: true,
    nullable: true,
  })
  @Expose()
  description: string | null;

  @ApiProperty({ example: 24.99, description: 'Prețul produsului', required: true })
  @Expose()
  price: number;

  @ApiProperty({
    example: 'https://example.com/images/margherita.jpg',
    description: 'URL-ul imaginii produsului',
    required: true,
    nullable: true,
  })
  @Expose()
  imageUrl: string | null;

  @ApiProperty({ example: 'SIMPLE', enum: ProductType, description: 'Tipul produsului', required: true })
  @Expose()
  type: ProductType;

  @ApiProperty({ example: 'ACTIVE', enum: ItemStatus, description: 'Statutul produsului (activ/inactiv)', required: true })
  @Expose()
  status: ItemStatus;

  @ApiProperty({ example: 1, description: 'ID-ul categoriei', required: true })
  @Expose()
  categoryId: number;

  @ApiProperty({
    type: CategoryResponseDto,
    description: 'Categoria produsului',
    required: true,
    nullable: true,
  })
  @Expose()
  category: CategoryResponseDto | null;

  @ApiProperty({
    example: ['roșii', 'mozzarella', 'busuioc'],
    description: 'Lista de ingrediente',
    type: [String],
    required: true,
  })
  @Expose()
  ingredients: string[];

  @ApiProperty({
    example: ['mică', 'medie', 'mare'],
    description: 'Lista de mărimi disponibile',
    type: [String],
    required: true,
  })
  @Expose()
  sizes: string[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora creării (format ISO 8601)', type: String, required: true })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora ultimei actualizări (format ISO 8601)', type: String, required: true })
  @Expose()
  updatedAt: string;
}
