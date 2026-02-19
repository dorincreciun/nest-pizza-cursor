import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FilterOptionDto } from './filter-option.dto';

/**
 * DTO de răspuns pentru filtrele disponibile ale produselor
 * Structură plată (flat) cu types, ingredients și sizes - toate ca FilterOptionDto[]
 * Fără proprietăți opționale - toate câmpurile sunt obligatorii
 */
export class ProductFiltersResponseDto {
  @ApiProperty({
    description: 'Tipuri de produse disponibile (SIMPLE/CONFIGURABLE)',
    type: [FilterOptionDto],
    required: true,
    example: [
      { id: 'SIMPLE', name: 'Simplu' },
      { id: 'CONFIGURABLE', name: 'Personalizabil' },
    ],
  })
  @Expose()
  types: FilterOptionDto[];

  @ApiProperty({
    description: 'Ingrediente disponibile în produsele filtrate',
    type: [FilterOptionDto],
    required: true,
    example: [
      { id: 'roșii', name: 'Roșii' },
      { id: 'mozzarella', name: 'Mozzarella' },
      { id: 'busuioc', name: 'Busuioc' },
    ],
  })
  @Expose()
  ingredients: FilterOptionDto[];

  @ApiProperty({
    description: 'Mărimi disponibile în produsele filtrate',
    type: [FilterOptionDto],
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
