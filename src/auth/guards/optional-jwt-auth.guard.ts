import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

/**
 * Guard JWT opțional.
 * Dacă există token valid, setează req.user.
 * Dacă nu există token sau este invalid, nu aruncă eroare și lasă user-ul null.
 * Folosit pentru rute publice care pot beneficia de informații despre utilizatorul logat.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Nu respectăm flag-ul @Public aici, vrem să permitem autentificare opțională și pe rutele publice.
    // Orice eroare va fi tratată în handleRequest.
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any, _info: any) {
    if (err) {
      return null;
    }
    if (!user) {
      return null;
    }
    return user;
  }
}

