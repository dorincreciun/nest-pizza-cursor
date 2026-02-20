import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProductResponseDto } from './product-response.dto';
import { PaginatedMetaDto } from '../../common/dto/paginated-meta.dto';

/**
 * DTO de răspuns pentru lista paginată de produse
 * Conform standardelor API: { data: T[], meta: { totalItems, currentPage, itemsPerPage, totalPages } }
 * Folosit pentru tipizarea corectă a răspunsului GET /products în Swagger și client.
 */
export class ProductListResponseDto {
  @ApiProperty({
    description: 'Lista de produse',
    type: ProductResponseDto,
    isArray: true,
    required: true,
  })
  @Expose()
  @Type(() => ProductResponseDto)
  data: ProductResponseDto[];

  @ApiProperty({
    description: 'Meta-informații pentru paginare',
    type: PaginatedMetaDto,
    required: true,
  })
  @Expose()
  @Type(() => PaginatedMetaDto)
  meta: PaginatedMetaDto;
}
