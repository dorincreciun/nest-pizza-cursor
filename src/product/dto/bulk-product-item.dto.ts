import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Câmpurile adiționale din răspunsul POST /products/bulk.
 * Fiecare element din data este: ProductResponseDto (entitate completă) + aceste câmpuri.
 */
export class BulkProductItemDto {
  @ApiProperty({
    example: 2,
    description: 'Cantitatea cerută de client pentru acest produs (din request).',
    required: true,
  })
  @Expose()
  qty: number;

  @ApiProperty({
    example: 10,
    description:
      'Cantitate disponibilă în stoc. Null dacă produsul nu are stoc definit (nelimitat).',
    required: true,
    nullable: true,
  })
  @Expose()
  availableQuantity: number | null;
}
