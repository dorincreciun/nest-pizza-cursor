import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProductType, ItemStatus } from '@prisma/client';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { IngredientResponseDto } from '../../ingredient/dto/ingredient-response.dto';
import { FilterOptionDto } from './filter-option.dto';

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
    description: 'Lista de ingrediente (entități cu id, slug, name, imageUrl)',
    type: IngredientResponseDto,
    isArray: true,
    required: true,
    example: [
      { id: 1, slug: 'rosii', name: 'Roșii', imageUrl: 'https://example.com/images/rosii.jpg' },
      { id: 2, slug: 'mozzarella', name: 'Mozzarella', imageUrl: null },
    ],
  })
  @Expose()
  @Type(() => IngredientResponseDto)
  ingredients: IngredientResponseDto[];

  @ApiProperty({
    description: 'Lista de mărimi disponibile (id = valoare tehnică, name = etichetă afișare)',
    type: FilterOptionDto,
    isArray: true,
    required: true,
    example: [
      { id: 'mică', name: 'Mică' },
      { id: 'medie', name: 'Medie' },
      { id: 'mare', name: 'Mare' },
    ],
  })
  @Expose()
  @Type(() => FilterOptionDto)
  sizes: FilterOptionDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora creării (format ISO 8601)', type: String, required: true })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data și ora ultimei actualizări (format ISO 8601)', type: String, required: true })
  @Expose()
  updatedAt: string;
}
