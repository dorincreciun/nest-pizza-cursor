import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pentru răspunsurile de eroare standardizate
 * Folosit pentru documentarea erorilor în Swagger
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Codul de status HTTP al erorii', required: true })
  statusCode: number;

  @ApiProperty({
    example: 'Email-ul este deja înregistrat',
    description: 'Mesajul de eroare sau array de mesaje de validare',
    required: true,
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request', description: 'Numele erorii (ex: Bad Request, Not Found, Conflict)', required: true })
  error: string;
}
