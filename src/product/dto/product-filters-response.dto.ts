import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FilterOptionDto } from './filter-option.dto';
import { IngredientResponseDto } from '../../ingredient/dto/ingredient-response.dto';

/**
 * DTO de răspuns pentru filtrele disponibile ale produselor
 * types și sizes: FilterOptionDto[]; ingredients: IngredientResponseDto[] (cu id, slug, name, imageUrl)
 */
export class ProductFiltersResponseDto {
  @ApiProperty({
    description: 'Tipuri de produse disponibile (SIMPLE/CONFIGURABLE)',
    type: FilterOptionDto,
    isArray: true,
    required: true,
    example: [
      { id: 'SIMPLE', name: 'Simplu' },
      { id: 'CONFIGURABLE', name: 'Personalizabil' },
    ],
  })
  @Expose()
  types: FilterOptionDto[];

  @ApiProperty({
    description: 'Ingrediente disponibile în produsele filtrate (cu id, slug, name, imageUrl)',
    type: IngredientResponseDto,
    isArray: true,
    required: true,
  })
  @Expose()
  @Type(() => IngredientResponseDto)
  ingredients: IngredientResponseDto[];

  @ApiProperty({
    description: 'Mărimi disponibile în produsele filtrate (id, name)',
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
  sizes: FilterOptionDto[];
}
