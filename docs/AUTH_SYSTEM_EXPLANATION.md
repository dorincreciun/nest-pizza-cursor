# Sistem de Autentificare - Explicație Completă

## Prezentare Generală

Acest document explică pas cu pas cum funcționează sistemul de autentificare implementat în aplicația NestJS. Sistemul folosește JWT (JSON Web Tokens) cu două tipuri de token-uri: **Access Token** și **Refresh Token**, unde refresh token-ul este stocat și verificat în baza de date pentru securitate maximă.

---

## 1. Arhitectura Sistemului

### Componente Principale

1. **Access Token** - Token JWT cu durată scurtă (15 minute) folosit pentru autentificarea request-urilor
2. **Refresh Token** - Token JWT cu durată lungă (7 zile) folosit pentru reînnoirea access token-ului
3. **Baza de Date** - Stochează refresh token-urile pentru validare și control (sursa de adevăr)
4. **Cookies** - Refresh token-ul este trimis DOAR prin cookie securizat (httpOnly, secure)
5. **TransformInterceptor** - Interceptor global care:
   - Înfășoară toate răspunsurile de succes în structura `{ data: T }`
   - Transformă datele calendaristice (Date objects) în format ISO 8601 string

### Fluxul de Date

```
Client → Server → TransformInterceptor → Baza de Date
   ↓        ↓              ↓                    ↓
Cookie  JWT Verify    { data: T }         Token Storage
                      ISO 8601 Dates
```

---

## 2. Procesul de Înregistrare (Register)

### Pasul 1: Client trimite cerere
```
POST /auth/register
Body: { email: "user@example.com", password: "SecurePass123!" }
```

### Pasul 2: Server validează datele
- Verifică formatul email-ului
- Verifică complexitatea parolei (minim 8 caractere, literă mare, literă mică, cifră, caracter special)
- Verifică dacă email-ul există deja în baza de date

### Pasul 3: Creare utilizator
- Hash-uiește parola cu bcrypt (10 rounds)
- Creează utilizatorul în baza de date cu:
  - `email` (unic)
  - `password` (hash-uit)
  - `firstName`, `lastName`, `profileImage` (null la înregistrare)

### Pasul 4: Generare token-uri
- **Access Token**: Generat cu JWT_SECRET, expiră în 15 minute
- **Refresh Token**: Generat cu JWT_REFRESH_SECRET, expiră în 7 zile

### Pasul 5: Salvare refresh token în baza de date
```sql
INSERT INTO refresh_tokens (token, user_id, expires_at)
VALUES ('jwt_token_here', 'user_uuid', '2026-02-19 15:48:13')
```

### Pasul 6: Transformare răspuns și date calendaristice
- TransformInterceptor global transformă datele calendaristice (Date) în ISO 8601 string
- TransformInterceptor înfășoară răspunsul în structura `{ data: T }`

### Pasul 7: Răspuns către client
- **Răspuns Body**: `{ data: { accessToken: "...", user: {...} } }`
  - `user.createdAt` și `user.updatedAt` sunt string-uri ISO 8601 (ex: "2024-01-15T10:30:00.000Z")
- **Refresh Token** setat în cookie securizat (httpOnly, secure, sameSite)
- Status: 201 Created

---

## 3. Procesul de Autentificare (Login)

### Pasul 1: Client trimite cerere
```
POST /auth/login
Body: { email: "user@example.com", password: "SecurePass123!" }
```

### Pasul 2: Server validează credențialele
- Caută utilizatorul după email în baza de date
- Compară parola hash-uită cu bcrypt.compare()
- Dacă nu există sau parola este greșită → 401 Unauthorized

### Pasul 3: Curățare token-uri vechi
- **IMPORTANT**: Șterge TOATE refresh token-urile vechi ale utilizatorului
- Acest lucru asigură că utilizatorul poate avea doar o sesiune activă la un moment dat
```sql
DELETE FROM refresh_tokens WHERE user_id = 'user_uuid'
```

### Pasul 4: Generare token-uri noi
- Generează access token și refresh token noi
- Salvează noul refresh token în baza de date

### Pasul 5: Transformare răspuns și date calendaristice
- TransformInterceptor global transformă datele calendaristice (Date) în ISO 8601 string
- TransformInterceptor înfășoară răspunsul în structura `{ data: T }`

### Pasul 6: Răspuns către client
- **Răspuns Body**: `{ data: { accessToken: "...", user: {...} } }`
  - `user.createdAt` și `user.updatedAt` sunt string-uri ISO 8601
- **Refresh Token** setat în cookie securizat
- Status: 200 OK

---

## 4. Procesul de Reînnoire Token (Refresh)

### Pasul 1: Client trimite cerere
```
POST /auth/refresh
Cookie: refreshToken=jwt_token_here
```

**IMPORTANT**: Refresh token-ul este trimis DOAR prin cookie, nu în body sau header!

### Pasul 2: Server citește token din cookie
- Extrage `refreshToken` din `req.cookies`
- Dacă lipsește → 401 Unauthorized

### Pasul 3: Verificare în baza de date (SURSA DE ADEVĂR)
```sql
SELECT * FROM refresh_tokens 
WHERE token = 'jwt_token_here'
```

**Aceasta este verificarea principală!** Dacă token-ul nu există în baza de date, sesiunea este considerată expirată.

### Pasul 4: Validări multiple
1. **Token există în baza de date?** → Dacă nu → 401 Unauthorized
2. **Token-ul a expirat?** (verifică `expiresAt`) → Dacă da → Șterge token-ul și → 401 Unauthorized
3. **Utilizatorul există?** → Dacă nu → Șterge token-ul și → 401 Unauthorized
4. **Verificare JWT** (pentru siguranță suplimentară) → Dacă invalid → 401 Unauthorized
5. **Payload-ul corespunde cu user_id din baza de date?** → Dacă nu → 401 Unauthorized

### Pasul 5: Rotire token (Token Rotation)
- **Șterge vechiul refresh token** din baza de date
- Generează noi token-uri (access + refresh)
- **Salvează noul refresh token** în baza de date

### Pasul 6: Transformare răspuns
- TransformInterceptor global înfășoară răspunsul în structura `{ data: T }`

### Pasul 7: Răspuns către client
- **Răspuns Body**: `{ data: { accessToken: "..." } }`
- **Noul Refresh Token** setat în cookie securizat
- Status: 200 OK

**De ce rotirea token-ului?**
- Mărește securitatea: dacă un token este compromis, devine invalid după prima utilizare
- Permite revocarea token-urilor compromisă

---

## 5. Procesul de Deconectare (Logout)

### Pasul 1: Client trimite cerere
```
POST /auth/logout
Authorization: Bearer access_token_here
Cookie: refreshToken=jwt_token_here
```

### Pasul 2: Server verifică autentificarea
- Verifică access token-ul din header (JWT Guard)
- Dacă invalid → 401 Unauthorized

### Pasul 3: Ștergere refresh token din baza de date
```sql
DELETE FROM refresh_tokens WHERE token = 'jwt_token_here'
```

**IMPORTANT**: Chiar dacă cookie-ul lipsește, serverul încearcă să șteargă token-ul pentru curățenie.

### Pasul 4: Ștergere cookie
- Setează cookie-ul `refreshToken` cu valoare goală și `maxAge: 0`
- Cookie-ul este șters din browser

### Pasul 5: Transformare răspuns
- TransformInterceptor global înfășoară răspunsul în structura `{ data: T }`

### Pasul 6: Răspuns către client
- Status: 200 OK
- **Răspuns Body**: `{ data: { message: "Deconectare reușită" } }`

**Notă**: Access token-ul rămâne valid până la expirare (15 minute), dar refresh token-ul este invalidat, deci nu se mai pot genera token-uri noi.

---

## 6. Procesul de Preluare Date Utilizator (Me)

### Pasul 1: Client trimite cerere
```
GET /auth/me
Authorization: Bearer access_token_here
```

### Pasul 2: Server verifică access token
- JwtAuthGuard extrage token-ul din header
- JwtStrategy validează token-ul și extrage payload-ul
- Caută utilizatorul în baza de date după `id` din payload

### Pasul 3: Transformare răspuns și date calendaristice
- TransformInterceptor global transformă datele calendaristice (Date) în ISO 8601 string
- TransformInterceptor înfășoară răspunsul în structura `{ data: T }`

### Pasul 4: Răspuns către client
- **Răspuns Body**: `{ data: { id, email, firstName, lastName, profileImage, rol, createdAt, updatedAt } }`
  - `createdAt` și `updatedAt` sunt string-uri ISO 8601 (ex: "2024-01-15T10:30:00.000Z")
- Status: 200 OK

---

## 7. Structura Răspunsurilor API

### TransformInterceptor Global

Toate răspunsurile de succes sunt automat înfășurate în structura `{ data: T }` de către `TransformInterceptor` global, configurat în `AppModule`:

```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: TransformInterceptor,
}
```

### Exemple de Răspunsuri

**Register/Login:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "profileImage": null,
      "rol": "USER",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Refresh Token:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Get Me:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": null,
    "rol": "USER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Logout:**
```json
{
  "data": {
    "message": "Deconectare reușită"
  }
}
```

### Transformare Date Calendaristice

Toate datele calendaristice (`createdAt`, `updatedAt`) sunt transformate automat din `Date` objects în format ISO 8601 string (ex: `"2024-01-15T10:30:00.000Z"`) de către `TransformInterceptor`.

---

## 8. Securitate și Best Practices

### De ce Refresh Token în Baza de Date?

1. **Control Total**: Serverul poate revoca oricând un token compromis
2. **Sesiuni Multiple**: Poți gestiona mai multe sesiuni pentru același utilizator
3. **Audit Trail**: Poți vedea când și de unde s-a conectat utilizatorul
4. **Expirare Garantată**: Chiar dacă JWT-ul este valid, dacă nu există în baza de date, este respins
5. **Sursa de Adevăr**: Baza de date este verificată întotdeauna înainte de a accepta un refresh token

### Măsuri de Securitate Implementate

1. **Refresh Token în Cookie Securizat**
   - `httpOnly: true` - Previne accesul JavaScript (protecție XSS)
   - `secure: true` (production) - Doar HTTPS
   - `sameSite: strict` (production) - Protecție CSRF

2. **Validare Multi-Nivel**
   - Verificare în baza de date (sursa de adevăr)
   - Verificare expirare JWT
   - Verificare existență utilizator
   - Verificare corespondență payload-user_id

3. **Rotire Token**
   - La fiecare refresh, vechiul token este șters
   - Token-ul compromis devine invalid după prima utilizare

4. **Single Session**
   - La login, toate token-urile vechi sunt șterse
   - Utilizatorul poate avea doar o sesiune activă

5. **Parole Hash-uite**
   - bcrypt cu 10 rounds
   - Parolele nu sunt niciodată returnate în răspunsuri

---

## 9. Structura Bazei de Date

### Tabela `users`
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hash-uit)
- first_name (String, Nullable)
- last_name (String, Nullable)
- profile_image (String, Nullable)
- rol (Enum: USER, ADMIN)
- created_at (DateTime)
- updated_at (DateTime)
```

### Tabela `refresh_tokens`
```sql
- id (UUID, Primary Key)
- token (String, Unique) - Token-ul JWT complet
- user_id (UUID, Foreign Key → users.id)
- expires_at (DateTime) - Data expirării
- created_at (DateTime)
```

**Indexuri**:
- `token` - Pentru căutare rapidă la refresh
- `user_id` - Pentru ștergerea token-urilor unui utilizator

**Cascade Delete**: Când un utilizator este șters, toate token-urile sale sunt șterse automat.

---

## 10. Fluxul Complet de Autentificare

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. POST /auth/register
     │    { email, password }
     ▼
┌─────────┐
│ Server  │
└────┬────┘
     │
     │ 2. Validează datele
     │ 3. Hash-uiește parola
     │ 4. Creează utilizator
     │ 5. Generează token-uri
     │ 6. Salvează refresh token în DB
     │
     ▼
┌─────────┐
│   DB    │ ← Refresh Token salvat
└─────────┘
     │
     │ 7. TransformInterceptor înfășoară răspunsul în { data: T }
     │ 8. TransformInterceptor transformă Date → ISO 8601 string
     │ 9. Răspuns: { data: { accessToken, user } }
     │    Cookie: refreshToken
     ▼
┌─────────┐
│ Client  │ ← Token-uri primite
└────┬────┘
     │
     │ 8. Request-uri cu Authorization: Bearer accessToken
     │    Cookie: refreshToken (automat)
     ▼
┌─────────┐
│ Server  │
└────┬────┘
     │
     │ 9. Verifică access token
     │    (JWT Guard + Strategy)
     ▼
┌─────────┐
│   API   │ ← Request procesat
└─────────┘
     │
     │ 10. Access token expirat?
     │     → POST /auth/refresh
     ▼
┌─────────┐
│ Server  │
└────┬────┘
     │
     │ 11. Verifică refresh token în DB
     │ 12. Validează token-ul
     │ 13. Șterge vechiul token
     │ 14. Generează token-uri noi
     │ 15. Salvează noul refresh token
     ▼
┌─────────┐
│   DB    │ ← Token nou salvat
└─────────┘
     │
     │ 16. TransformInterceptor înfășoară răspunsul în { data: T }
     │ 17. Răspuns: { data: { accessToken } }
     │     Cookie: refreshToken (nou)
     ▼
┌─────────┐
│ Client  │ ← Token-uri noi
└─────────┘
```

---

## 11. Scenarii de Eroare

### Refresh Token Invalid

**Caz 1**: Token-ul nu există în baza de date
```
→ 401 Unauthorized: "Refresh token invalid sau expirat"
→ Token-ul a fost probabil șters (logout, expirare, compromis)
```

**Caz 2**: Token-ul a expirat (expiresAt < now)
```
→ 401 Unauthorized: "Refresh token expirat"
→ Token-ul este șters automat din baza de date
```

**Caz 3**: Utilizatorul nu există
```
→ 401 Unauthorized: "Utilizatorul nu există"
→ Token-ul este șters din baza de date
```

**Caz 4**: Payload-ul nu corespunde cu user_id
```
→ 401 Unauthorized: "Refresh token invalid"
→ Token-ul este șters din baza de date
```

### Access Token Invalid

**Caz 1**: Token lipsă
```
→ 401 Unauthorized: "Token invalid sau expirat"
```

**Caz 2**: Token expirat
```
→ 401 Unauthorized: "Token invalid sau expirat"
→ Client trebuie să folosească /auth/refresh
```

**Caz 3**: Token falsificat
```
→ 401 Unauthorized: "Token invalid sau expirat"
→ JWT verification eșuează
```

---

## 12. Recomandări pentru Client (Frontend)

### Stocare Token-uri

1. **Access Token**: Stocat în memorie (nu în localStorage/sessionStorage)
   - Poate fi stocat în state management (Redux, Zustand, etc.)
   - Se șterge automat când se închide aplicația

2. **Refresh Token**: Nu trebuie stocat manual!
   - Este gestionat automat de browser prin cookie
   - Nu accesați cookie-ul din JavaScript (httpOnly)

### Gestionare Erori

1. **401 Unauthorized pe request normal**
   ```javascript
   if (error.status === 401) {
     // Încearcă refresh token
     const newAccessToken = await refreshAccessToken();
     // Reîncearcă request-ul original
   }
   ```

2. **401 Unauthorized la refresh**
   ```javascript
   if (error.status === 401 && endpoint === '/auth/refresh') {
     // Redirect la login
     router.push('/login');
   }
   ```

### Interceptor pentru Refresh Automat

```javascript
// Exemplu cu Axios
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        // Refresh token-ul este trimis automat prin cookie
        const { data } = await axios.post('/auth/refresh');
        // Răspunsul este în formatul { data: { accessToken } }
        const accessToken = data.data.accessToken;
        // Actualizează access token
        setAccessToken(accessToken);
        // Reîncearcă request-ul original
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Redirect la login
        router.push('/login');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

### Accesarea Datelor din Răspunsuri

**IMPORTANT**: Toate răspunsurile de succes sunt înfășurate în `{ data: T }`:

```javascript
// CORECT
const response = await axios.post('/auth/login', { email, password });
const { accessToken, user } = response.data.data; // Prima "data" este din axios, a doua din API

// INCORECT
const { accessToken, user } = response.data; // Lipsă nivelul "data"
```

**Exemplu complet:**
```javascript
// Login
const loginResponse = await axios.post('/auth/login', {
  email: 'user@example.com',
  password: 'SecurePass123!'
});
// loginResponse.data = { data: { accessToken: "...", user: {...} } }
const { accessToken, user } = loginResponse.data.data;

// Get Me
const meResponse = await axios.get('/auth/me', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
// meResponse.data = { data: { id, email, firstName, ... } }
const userData = meResponse.data.data;
```

---

## 13. Concluzie

Sistemul de autentificare implementat oferă:

✅ **Securitate maximă** - Refresh token-uri verificate în baza de date (sursa de adevăr)
✅ **Control complet** - Revocare token-uri, single session
✅ **Best practices** - Rotire token, validare multi-nivel
✅ **Scalabilitate** - Poate gestiona multiple sesiuni dacă este necesar
✅ **Audit** - Toate token-urile sunt înregistrate în baza de date
✅ **Standardizare API** - Toate răspunsurile în format `{ data: T }` prin TransformInterceptor
✅ **Format consistent** - Datele calendaristice în format ISO 8601 string

### Puncte Cheie

1. **Baza de Date = Sursa de Adevăr**: Chiar dacă un token JWT este valid din punct de vedere tehnic, dacă nu există în baza de date, sesiunea este considerată expirată și respinsă.

2. **TransformInterceptor Global**: Toate răspunsurile de succes sunt automat înfășurate în `{ data: T }` și datele calendaristice sunt transformate în ISO 8601 string.

3. **Refresh Token DOAR în Cookie**: Refresh token-ul este trimis exclusiv prin cookie securizat (httpOnly, secure), nu în body sau header.

4. **Single Session**: La login, toate token-urile vechi sunt șterse, asigurând o singură sesiune activă per utilizator.

5. **Token Rotation**: La fiecare refresh, vechiul token este șters și unul nou este generat, mărind securitatea.
