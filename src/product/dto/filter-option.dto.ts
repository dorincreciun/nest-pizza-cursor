import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO reutilizabil pentru o opțiune de filtru
 * Conține valoarea tehnică (id) și eticheta pentru UI (name)
 */
export class FilterOptionDto {
  @ApiProperty({
    example: 'CONFIGURABLE',
    description: 'Valoarea tehnică a filtrului (trimisă la server)',
    required: true,
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'Personalizabil',
    description: 'Eticheta formatată pentru afișare în UI',
    required: true,
  })
  @Expose()
  name: string;
}
