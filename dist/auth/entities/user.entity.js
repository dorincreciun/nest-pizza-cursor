"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserEntity {
}
exports.UserEntity = UserEntity;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID-ul unic al utilizatorului',
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'john.doe@example.com',
        description: 'Adresa de email a utilizatorului',
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'John',
        description: 'Prenumele utilizatorului',
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Doe',
        description: 'Numele de familie al utilizatorului',
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://example.com/profile.jpg',
        description: 'URL-ul imaginii de profil',
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "profileImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'USER',
        enum: client_1.Role,
        description: 'Rolul utilizatorului în sistem',
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "rol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2024-01-15T10:30:00.000Z',
        description: 'Data și ora creării contului (format ISO 8601)',
        type: String,
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2024-01-15T10:30:00.000Z',
        description: 'Data și ora ultimei actualizări (format ISO 8601)',
        type: String,
    }),
    __metadata("design:type", String)
], UserEntity.prototype, "updatedAt", void 0);
//# sourceMappingURL=user.entity.js.map