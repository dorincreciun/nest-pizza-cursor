import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * DTO pentru crearea unui ingredient
 * Slug unic, kebab-case. Un ingredient poate fi atașat la mai multe produse.
 */
export class CreateIngredientDto {
  @ApiProperty({
    example: 'rosii',
    description: 'Identificator unic URL-friendly (kebab-case)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slug-ul este obligatoriu' })
  @MinLength(2)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug-ul trebuie să fie în format kebab-case',
  })
  slug: string;

  @ApiProperty({
    example: 'Roșii',
    description: 'Numele afișat al ingredientului',
  })
  @IsString()
  @IsNotEmpty({ message: 'Numele este obligatoriu' })
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/rosii.jpg',
    description: 'URL-ul imaginii ingredientului',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
