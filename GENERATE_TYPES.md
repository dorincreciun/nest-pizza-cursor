# Generare Tipuri TypeScript pentru Frontend

Acest document explică cum să generezi tipurile TypeScript pentru clientul frontend din schema OpenAPI/Swagger.

## Link-uri Schema OpenAPI

După ce pornești serverul (`npm run start:dev`), următoarele endpoint-uri sunt disponibile:

- **Swagger UI**: http://localhost:3000/api
- **OpenAPI Schema JSON**: http://localhost:3000/api-json
- **OpenAPI Schema YAML**: http://localhost:3000/api-yaml

## Metode de Generare Tipuri

### 1. Folosind `openapi-typescript` (Recomandat)

Generează tipuri TypeScript pure din schema OpenAPI.

```bash
# Instalează pachetul global
npm install -g openapi-typescript

# Generează tipurile
npx openapi-typescript http://localhost:3000/api-json -o ./src/types/api.ts
```

Sau folosește scriptul din `package.json`:
```bash
npm run generate:types
```

### 2. Folosind `swagger-typescript-api`

Generează un client API complet cu tipuri și funcții pentru fiecare endpoint.

```bash
# Instalează pachetul global
npm install -g swagger-typescript-api

# Generează clientul API
npx swagger-typescript-api -p http://localhost:3000/api-json -o ./src/api -n api.ts
```

Sau folosește scriptul din `package.json`:
```bash
npm run generate:api-client
```

### 3. Folosind `openapi-generator`

Generează client-ul în mai multe limbaje și framework-uri.

```bash
# Instalează OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generează client TypeScript-Axios
openapi-generator-cli generate -i http://localhost:3000/api-json -g typescript-axios -o ./src/api
```

### 4. Folosind `orval`

Un tool modern pentru generarea de client-uri TypeScript din OpenAPI.

```bash
# Instalează orval
npm install -D orval

# Creează fișierul de configurare orval.config.ts
# Apoi rulează:
npx orval
```

## Exemplu de Utilizare în Frontend

După generarea tipurilor, poți folosi tipurile în codul frontend:

```typescript
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './types/api';

// Folosește tipurile pentru validare și autentificare
const registerUser = async (data: RegisterDto): Promise<AuthResponseDto> => {
  const response = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include', // Important pentru cookies
  });
  return response.json();
};
```

## Notă Importantă

- Asigură-te că serverul rulează înainte de a genera tipurile
- Tipurile se actualizează automat când schimbi schema API
- Regenerează tipurile după fiecare modificare în API

## Link-uri Utile

- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [orval](https://github.com/anymaniax/orval)
