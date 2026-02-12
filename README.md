# Nest Pizza API

API backend pentru gestionarea comenzilor de pizza, construit cu NestJS, Prisma și PostgreSQL.

## Tehnologii

- **Framework:** NestJS
- **ORM:** Prisma
- **Baza de date:** PostgreSQL
- **Autentificare:** JWT (JSON Web Tokens)
- **Documentație:** Swagger/OpenAPI

## Instalare

### 1. Instalează dependențele

```bash
npm install
```

### 2. Configurează variabilele de mediu

Creează un fișier `.env` în rădăcina proiectului:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nest_pizza?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
```

### 3. Configurează baza de date

```bash
# Generează clientul Prisma
npx prisma generate

# Rulează migrațiile
npx prisma migrate dev --name init

# (Opțional) Deschide Prisma Studio pentru a gestiona datele
npx prisma studio
```

### 4. Pornește aplicația

```bash
# Modul development (cu watch)
npm run start:dev

# Modul production
npm run start:prod
```

Aplicația va rula pe `http://localhost:3000`

## Documentație API

După ce pornești aplicația, documentația Swagger este disponibilă la:
- **Swagger UI:** http://localhost:3000/api

## Endpoint-uri Autentificare

### POST /auth/register
Înregistrează un nou utilizator.

**Body:**
```json
{
  "email": "john.doe@example.com",
  "nume": "John Doe",
  "password": "SecurePassword123!"
}
```

**Răspuns:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "nume": "John Doe",
    "rol": "USER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /auth/login
Autentifică un utilizator existent.

**Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Răspuns:** Similar cu `/auth/register`

### GET /auth/me
Preluare date utilizator curent (necesită autentificare).

**Headers:**
```
Authorization: Bearer <token>
```

**Răspuns:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "nume": "John Doe",
  "rol": "USER",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## Structura Proiectului

```
src/
├── auth/                    # Modulul de autentificare
│   ├── controllers/        # Controllerele API
│   ├── services/           # Logica de business
│   ├── dto/                # Data Transfer Objects
│   ├── entities/           # Entități pentru Swagger
│   ├── strategies/         # Strategii Passport
│   ├── guards/             # Guards pentru protecție
│   └── decorators/         # Decoratori personalizați
├── prisma/                 # Serviciul Prisma
├── app.module.ts           # Modulul principal
└── main.ts                 # Punctul de intrare
```

## Scripturi Disponibile

- `npm run build` - Compilează aplicația
- `npm run start` - Pornește aplicația
- `npm run start:dev` - Pornește în modul development (watch)
- `npm run start:debug` - Pornește în modul debug
- `npm run start:prod` - Pornește în modul production
- `npm run lint` - Rulează linter-ul
- `npm run test` - Rulează testele
- `npx prisma studio` - Deschide Prisma Studio

## Securitate

- Toate rutele sunt protejate implicit de `JwtAuthGuard`
- Rutele publice trebuie marcate cu decoratorul `@Public()`
- Parolele sunt hash-uite cu bcrypt înainte de a fi salvate
- Token-urile JWT au un timp de expirare configurat

## Licență

MIT
