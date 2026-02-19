import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO pentru actualizarea unui produs
 * Toate câmpurile sunt opționale (PartialType din CreateProductDto)
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
