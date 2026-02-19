import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { CategoryStatus } from '@prisma/client';

/**
 * DTO pentru crearea unei categorii
 * Slug-ul trebuie să fie unic și în format kebab-case
 */
export class CreateCategoryDto {
  @ApiProperty({
    example: 'pizza-clasica',
    description: 'Identificator unic URL-friendly pentru categorie (kebab-case)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slug-ul este obligatoriu' })
  @MinLength(2, { message: 'Slug-ul trebuie să aibă minim 2 caractere' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug-ul trebuie să fie în format kebab-case (ex: pizza-clasica)',
  })
  slug: string;

  @ApiProperty({
    example: 'Pizza Clasică',
    description: 'Numele afișat al categoriei',
  })
  @IsString()
  @IsNotEmpty({ message: 'Numele este obligatoriu' })
  @MinLength(2, { message: 'Numele trebuie să aibă minim 2 caractere' })
  name: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: CategoryStatus,
    description: 'Statutul categoriei (activ/inactiv). Implicit: ACTIVE',
  })
  @IsEnum(CategoryStatus, { message: 'Statutul trebuie să fie ACTIVE sau INACTIVE' })
  status?: CategoryStatus;
}
