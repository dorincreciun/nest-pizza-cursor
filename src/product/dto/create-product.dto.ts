import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsArray,
  MinLength,
  Min,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, ItemStatus } from '@prisma/client';

/**
 * DTO pentru crearea unui produs
 * Slug-ul trebuie să fie unic, în format kebab-case. Categoria trebuie să existe.
 */
export class CreateProductDto {
  @ApiProperty({
    example: 'margherita',
    description: 'Identificator unic URL-friendly pentru produs (kebab-case)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slug-ul este obligatoriu' })
  @MinLength(2, { message: 'Slug-ul trebuie să aibă minim 2 caractere' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug-ul trebuie să fie în format kebab-case (ex: margherita)',
  })
  slug: string;

  @ApiProperty({
    example: 'Pizza Margherita',
    description: 'Numele afișat al produsului',
  })
  @IsString()
  @IsNotEmpty({ message: 'Numele este obligatoriu' })
  @MinLength(2, { message: 'Numele trebuie să aibă minim 2 caractere' })
  name: string;

  @ApiPropertyOptional({
    example: 'Pizza clasică cu roșii și mozzarella',
    description: 'Descrierea produsului',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 24.99,
    description: 'Prețul produsului',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Prețul trebuie să fie pozitiv' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 'https://example.com/images/margherita.jpg',
    description: 'URL-ul imaginii produsului',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'SIMPLE',
    enum: ProductType,
    description: 'Tipul produsului. Implicit: SIMPLE',
  })
  @IsOptional()
  @IsEnum(ProductType, { message: 'Tipul trebuie să fie SIMPLE sau CONFIGURABLE' })
  type?: ProductType;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ItemStatus,
    description: 'Statutul produsului (activ/inactiv). Implicit: ACTIVE',
  })
  @IsOptional()
  @IsEnum(ItemStatus, { message: 'Statutul trebuie să fie ACTIVE sau INACTIVE' })
  status?: ItemStatus;

  @ApiProperty({
    example: 1,
    description: 'ID-ul categoriei căreia îi aparține produsul',
  })
  @IsInt()
  @Min(1, { message: 'categoryId trebuie să fie un număr întreg pozitiv' })
  @Type(() => Number)
  categoryId: number;

  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'ID-urile ingredientelor atașate produsului (trebuie să existe în baza de date)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  ingredientIds?: number[];

  @ApiPropertyOptional({
    example: ['mică', 'medie', 'mare'],
    description: 'Lista de mărimi disponibile',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];
}
