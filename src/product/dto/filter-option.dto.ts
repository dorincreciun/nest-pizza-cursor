import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO reutilizabil pentru o opțiune de filtru.
 * Conține identificatorul numeric (id), eticheta pentru afișare în UI (name)
 * și, opțional, un preț suplimentar (extraPrice) față de prețul de bază.
 * Folosit pentru tipuri de produs (SIMPLE/CONFIGURABLE), mărimi (mică, medie, mare, familie)
 * și orice altă opțiune care poate modifica logica produsului.
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

  @ApiProperty({
    example: 5,
    description:
      'Prețul suplimentar (în lei) față de prețul de bază al produsului pentru această opțiune. ' +
      'Null în cazul în care opțiunea nu modifică prețul (ex: tip produs folosit doar pentru filtrare).',
    required: true,
    nullable: true,
    type: Number,
  })
  @Expose()
  extraPrice: number | null;
}
