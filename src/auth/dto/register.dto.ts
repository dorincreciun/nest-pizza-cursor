import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * DTO pentru înregistrarea unui nou utilizator
 * La înregistrare sunt necesare doar email și parolă
 */
export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Adresa de email a utilizatorului',
  })
  @IsEmail({}, { message: 'Email-ul trebuie să fie valid' })
  @IsNotEmpty({ message: 'Email-ul este obligatoriu' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Parola utilizatorului (minim 8 caractere, cel puțin o literă mare, o literă mică, o cifră și un caracter special)',
    minLength: 8,
  })
  @IsString({ message: 'Parola trebuie să fie un string' })
  @IsNotEmpty({ message: 'Parola este obligatoriu' })
  @MinLength(8, { message: 'Parola trebuie să aibă minim 8 caractere' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Parola trebuie să conțină cel puțin o literă mare, o literă mică, o cifră și un caracter special',
    },
  )
  password: string;
}
