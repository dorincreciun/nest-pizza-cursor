import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FilterSectionDto } from './filter-section.dto';

/**
 * DTO de răspuns pentru filtrele disponibile ale produselor.
 * Listă de secțiuni: fiecare are name (ex. "Tipuri", "Ingrediente", "Mărimi") și options.
 */
export class ProductFiltersResponseDto {
  @ApiProperty({
    description: 'Lista de secțiuni de filtre. Fiecare secțiune are name, url_key și options.',
    type: FilterSectionDto,
    isArray: true,
    required: true,
    example: [
      {
        name: 'Tipuri',
        url_key: 'types',
        options: [
          { id: 1, name: 'Simplu' },
          { id: 2, name: 'Personalizabil' },
        ],
      },
      {
        name: 'Mărimi',
        url_key: 'sizes',
        options: [
          { id: 1, name: 'Mică' },
          { id: 2, name: 'Medie' },
          { id: 3, name: 'Mare' },
        ],
      },
    ],
  })
  @Expose()
  @Type(() => FilterSectionDto)
  filters: FilterSectionDto[];
}
