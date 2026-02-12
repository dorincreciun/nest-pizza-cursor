import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pentru autentificarea unui utilizator existent
 */
export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Adresa de email a utilizatorului',
  })
  @IsEmail({}, { message: 'Email-ul trebuie să fie valid' })
  @IsNotEmpty({ message: 'Email-ul este obligatoriu' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Parola utilizatorului',
  })
  @IsString({ message: 'Parola trebuie să fie un string' })
  @IsNotEmpty({ message: 'Parola este obligatoriu' })
  password: string;
}
