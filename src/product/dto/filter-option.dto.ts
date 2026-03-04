import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO reutilizabil pentru o opțiune de filtru.
 * Conține identificatorul numeric (id) și eticheta pentru afișare în UI (name).
 * Folosit pentru tipuri de produs (SIMPLE/CONFIGURABLE) și mărimi (mică, medie, mare, familie).
 */
export class FilterOptionDto {
  @ApiProperty({
    example: 2,
    description: 'Identificatorul numeric al opțiunii (trimis la server la filtrare)',
    required: true,
    type: Number,
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Personalizabil',
    description: 'Eticheta formatată pentru afișare în UI',
    required: true,
  })
  @Expose()
  name: string;
}
