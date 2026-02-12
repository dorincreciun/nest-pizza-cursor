import { Role } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    rol: Role;
    createdAt: string;
    updatedAt: string;
}
