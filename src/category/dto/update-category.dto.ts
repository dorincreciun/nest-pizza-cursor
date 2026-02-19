import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '@prisma/client';

/**
 * DTO pentru actualizarea unei categorii
 * Toate câmpurile sunt opționale
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({
    example: 'INACTIVE',
    enum: CategoryStatus,
    description: 'Statutul categoriei (activ/inactiv)',
  })
  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Statutul trebuie să fie ACTIVE sau INACTIVE' })
  status?: CategoryStatus;
}
