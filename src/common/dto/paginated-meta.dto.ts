import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO pentru meta-informațiile de paginare
 * Conform standardelor API: toate listele returnează { data: T[], meta: { total, page, limit } }
 */
export class PaginatedMetaDto {
  @ApiProperty({
    example: 50,
    description: 'Numărul total de înregistrări care corespund filtrelor',
    required: true,
  })
  @Expose()
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Numărul paginii curente',
    required: true,
  })
  @Expose()
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Numărul de înregistrări per pagină',
    required: true,
  })
  @Expose()
  limit: number;
}
