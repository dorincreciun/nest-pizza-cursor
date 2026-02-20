import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO pentru meta-informațiile de paginare
 * Conform standardelor API: toate listele returnează { data: T[], meta: { totalItems, currentPage, itemsPerPage, totalPages } }
 */
export class PaginatedMetaDto {
  @ApiProperty({
    example: 50,
    description: 'Numărul total de înregistrări (itemuri) care corespund filtrelor',
    required: true,
  })
  @Expose()
  totalItems: number;

  @ApiProperty({
    example: 1,
    description: 'Numărul paginii curente (1-based)',
    required: true,
  })
  @Expose()
  currentPage: number;

  @ApiProperty({
    example: 10,
    description: 'Numărul de înregistrări (itemuri) per pagină',
    required: true,
  })
  @Expose()
  itemsPerPage: number;

  @ApiProperty({
    example: 5,
    description: 'Numărul total de pagini disponibile. 0 dacă nu există înregistrări.',
    required: true,
  })
  @Expose()
  totalPages: number;
}
