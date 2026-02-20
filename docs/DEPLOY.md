# Deploy: Docker și CI/CD (conform regulilor deploy.mdc)

## Docker

- **Dockerfile**: build multi-stage (Stage 1: build + `prisma generate`, Stage 2: runtime). La pornire rulează `prisma migrate deploy` (nu `migrate dev`), apoi aplicația.
- **.dockerignore**: exclude `.env` și fișiere inutile; nu se include niciodată `.env` în imagine.
- **Variabile de mediu**: transmise prin `docker-compose.yml` / `docker-compose.prod.yml` (fișier `.env` pe server).

### Local

```bash
# .env trebuie să existe (copiază din .env.example)
docker compose up --build -d
```

### Producție (VPS Hostinger)

1. Pe server: clonează repo-ul și adaugă un fișier `.env` cu toate variabilele (inclusiv `GHCR_IMAGE`, vezi mai jos).
2. La prima deploy sau după modificări: în directorul proiectului pe server rulezi (sau CI/CD face automat):
   - `docker compose -f docker-compose.prod.yml pull`
   - `docker compose -f docker-compose.prod.yml up -d`

---

## CI/CD (GitHub Actions)

- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: push pe branch-ul `main`
- **Pași**: build imagine → push în GitHub Container Registry (GHCR) → SSH pe Hostinger → `docker compose pull && docker compose up -d`

### GitHub Secrets (obligatorii)

| Secret           | Descriere |
|-----------------|-----------|
| `HOSTINGER_IP`  | Adresa IP a VPS-ului Hostinger |
| `SSH_PRIVATE_KEY` | Cheia privată SSH pentru user-ul de deploy |
| `SSH_USERNAME`  | Username-ul SSH (ex: `root` sau `ubuntu`) |
| `APP_PATH`      | Calea pe server unde este proiectul (ex: `/home/user/nest-pizza-cursor`) |

### Setări pe server (VPS)

1. **.env** în directorul proiectului, cu cel puțin:
   - `DATABASE_URL` – conexiune PostgreSQL
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `CORS_ORIGINS`
   - `GHCR_IMAGE=ghcr.io/OWNER/REPO:latest` (ex: `ghcr.io/username/nest-pizza-cursor:latest`)

2. **Docker și Docker Compose** instalate.

3. **Acces GHCR** (dacă repo-ul e privat): pe server, `docker login ghcr.io` cu un Personal Access Token cu `read:packages`, sau configurează credentialele în workflow pentru a le injecta pe server.

4. Fișierele **docker-compose.prod.yml** și **.env** trebuie să fie prezente în `APP_PATH` (de obicei prin clone al repo-ului pe server).

---

## Sincronizare

- La modificări în **prisma/schema.prisma**: rulezi local `npx prisma generate`; Dockerfile conține deja acest pas în stage-ul de build.
- Orice dependență nouă în **package.json** este inclusă în build-ul Docker prin `npm ci` și `npm run build`.
- Dacă schimbi porturi sau variabile critice, actualizează și **GitHub Secrets** / **.env** pe server.
