import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FilterOptionDto } from './filter-option.dto';
import { IngredientResponseDto } from '../../ingredient/dto/ingredient-response.dto';

/**
 * Secțiune de filtru: nume, url_key (cheia pentru query în URL) și lista de opțiuni.
 * options: FilterOptionDto[] pentru Tipuri/Mărimi, IngredientResponseDto[] pentru Ingrediente.
 */
export class FilterSectionDto {
  @ApiProperty({
    example: 'Tipuri',
    description: 'Numele secțiunii de filtru (ex: Tipuri, Ingrediente, Mărimi)',
    required: true,
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'types',
    description: 'Cheia pentru parametrul din URL (ex: GET /products?types=1&types=2, ?ingredients=1, ?sizes=1&sizes=2)',
    required: true,
  })
  @Expose()
  url_key: string;

  @ApiProperty({
    description:
      'Opțiunile din secțiune. Pentru Tipuri și Mărimi: { id: number, name: string }. Pentru Ingrediente: { id, slug, name, imageUrl, defaultExtraPrice }.',
    type: FilterOptionDto,
    isArray: true,
    required: true,
    example: [
      { id: 1, name: 'Simplu' },
      { id: 2, name: 'Personalizabil' },
    ],
  })
  @Expose()
  options: (FilterOptionDto | IngredientResponseDto)[];
}
