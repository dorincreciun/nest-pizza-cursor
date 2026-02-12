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
exports.RegisterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'john.doe@example.com',
        description: 'Adresa de email a utilizatorului',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email-ul trebuie să fie valid' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email-ul este obligatoriu' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'SecurePassword123!',
        description: 'Parola utilizatorului (minim 8 caractere, cel puțin o literă mare, o literă mică, o cifră și un caracter special)',
        minLength: 8,
    }),
    (0, class_validator_1.IsString)({ message: 'Parola trebuie să fie un string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Parola este obligatoriu' }),
    (0, class_validator_1.MinLength)(8, { message: 'Parola trebuie să aibă minim 8 caractere' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Parola trebuie să conțină cel puțin o literă mare, o literă mică, o cifră și un caracter special',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
//# sourceMappingURL=register.dto.js.map