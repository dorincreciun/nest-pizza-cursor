import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserResponseDto } from '../dto/user-response.dto';
import { Role } from '@prisma/client';

/**
 * Guard care restricționează accesul doar la utilizatorii cu rol ADMIN
 * Trebuie folosit pe rute protejate de JwtAuthGuard (req.user este deja setat)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: UserResponseDto | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Acces interzis');
    }

    if (user.rol !== Role.ADMIN) {
      throw new ForbiddenException('Doar administratorii pot efectua această acțiune');
    }

    return true;
  }
}
