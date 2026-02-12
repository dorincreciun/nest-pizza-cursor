import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

/**
 * DTO de răspuns pentru autentificare
 * Conține access token-ul (în body) și refresh token-ul (DOAR în cookie, securizat)
 */
export class AuthResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'Access token JWT pentru autentificare (trimis în body)',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Datele utilizatorului autentificat',
  })
  @Expose()
  user: UserResponseDto;
}
