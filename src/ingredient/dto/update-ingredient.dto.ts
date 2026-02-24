import { PartialType } from '@nestjs/swagger';
import { CreateIngredientDto } from './create-ingredient.dto';

/**
 * DTO pentru actualizarea unui ingredient
 * Toate câmpurile sunt opționale.
 */
export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}
