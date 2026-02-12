import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator pentru preluarea utilizatorului curent din Request
 * Folosește datele din req.user setate de JwtAuthGuard
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
