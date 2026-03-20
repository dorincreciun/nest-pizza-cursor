import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, Min, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/** Limită maximă de articole per request pentru a preveni abuzul */
export const BULK_PRODUCTS_MAX_ITEMS = 30;

/**
 * Un articol din request-ul POST /products/bulk: ID produs + cantitatea cerută.
 */
export class BulkProductItemRequestDto {
  @ApiProperty({
    example: '1',
    description: 'ID-ul produsului (string, se parsează la număr)',
    required: true,
  })
  @IsString()
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Cantitatea cerută de client pentru acest produs',
    minimum: 1,
    required: true,
  })
  @Min(1, { message: 'quantity trebuie să fie cel puțin 1' })
  @IsInt()
  @Type(() => Number)
  quantity: number;
}

/**
 * DTO pentru request-ul POST /products/bulk.
 * Conține lista de perechi (productId, quantity) – id produs și cantitatea cerută.
 */
export class BulkProductsRequestDto {
  @ApiProperty({
    example: [
      { productId: '1', quantity: 2 },
      { productId: '2', quantity: 1 },
    ],
    description:
      'Lista de articole: productId (string) și quantity (cantitatea cerută). Maxim ' +
      BULK_PRODUCTS_MAX_ITEMS +
      ' articole per request.',
    type: [BulkProductItemRequestDto],
    minItems: 1,
    maxItems: BULK_PRODUCTS_MAX_ITEMS,
    required: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'items trebuie să conțină cel puțin un element' })
  @ArrayMaxSize(BULK_PRODUCTS_MAX_ITEMS, {
    message: `items nu poate conține mai mult de ${BULK_PRODUCTS_MAX_ITEMS} elemente`,
  })
  @ValidateNested({ each: true })
  @Type(() => BulkProductItemRequestDto)
  items: BulkProductItemRequestDto[];
}
