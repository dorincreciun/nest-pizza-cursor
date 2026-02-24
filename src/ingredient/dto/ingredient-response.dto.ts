import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO de răspuns pentru un ingredient
 * Un ingredient poate fi atașat la mai multe produse (many-to-many).
 */
export class IngredientResponseDto {
  @ApiProperty({ example: 1, description: 'ID-ul unic al ingredientului', required: true })
  @Expose()
  id: number;

  @ApiProperty({ example: 'rosii', description: 'Slug-ul unic (URL-friendly)', required: true })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Roșii', description: 'Numele afișat al ingredientului', required: true })
  @Expose()
  name: string;

  @ApiProperty({
    example: null,
    description: 'URL-ul imaginii ingredientului. Null dacă nu există imagine.',
    required: true,
    nullable: true,
  })
  @Expose()
  imageUrl: string | null;
}
