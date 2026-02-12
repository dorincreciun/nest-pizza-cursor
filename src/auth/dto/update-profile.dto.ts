import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * DTO pentru actualizarea profilului utilizatorului
 * Toate câmpurile sunt opționale - utilizatorul poate actualiza doar câmpurile dorite
 * profileImage este gestionat prin file upload și va fi procesat separat
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Numele utilizatorului',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Numele trebuie să fie un string' })
  @MaxLength(100, { message: 'Numele nu poate depăși 100 de caractere' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Prenumele utilizatorului',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Prenumele trebuie să fie un string' })
  @MaxLength(100, { message: 'Prenumele nu poate depăși 100 de caractere' })
  lastName?: string;
}
