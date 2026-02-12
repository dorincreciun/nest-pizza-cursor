import { SetMetadata } from '@nestjs/common';

/**
 * Cheia metadata pentru decoratorul @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator pentru marcarea rutelor ca fiind publice
 * Rutele marcate cu @Public() nu vor fi protejate de JwtAuthGuard
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
