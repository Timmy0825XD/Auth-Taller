# Auth-Taller: JWT y Refresh Tokens

Taller práctico para aprender autenticación segura con **JSON Web Tokens (JWT)** y **refresh tokens** usando Node.js, Express y MongoDB.

Basado en el artículo de [FreeCodeCamp](https://www.freecodecamp.org/news/how-to-build-a-secure-authentication-system-with-jwt-and-refresh-tokens/).

---

## Qué aprenderás

- Crear y verificar **access tokens** JWT de corta duración
- Mantener sesiones con **refresh tokens** de larga duración
- **Rotar** refresh tokens para bloquear reutilización de tokens robados
- Proteger rutas con middleware de autenticación
- Almacenar refresh tokens de forma segura (hash + cookie httpOnly)

---

## Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- npm
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuita)
- [Postman](https://www.postman.com/) o Insomnia para probar la API

---

## Instalación

```bash
git clone https://github.com/Timmy0825XD/Auth-Taller.git
cd Auth-Taller
npm install
```

Copia el archivo de entorno y completa tus credenciales:

```bash
cp .env.example .env
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (por defecto `5000`) |
| `MONGO_URI` | Cadena de conexión a MongoDB Atlas |
| `JWT_SECRET` | Secreto para firmar access tokens |
| `REFRESH_TOKEN_SECRET` | Secreto distinto para refresh tokens |
| `NODE_ENV` | `development` o `production` |

Genera secretos seguros con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Importante:** nunca subas el archivo `.env` al repositorio. Usa secretos **diferentes** para `JWT_SECRET` y `REFRESH_TOKEN_SECRET`.

---

## Ejecución

```bash
# Desarrollo (recarga automática)
npm run dev

# Producción
npm start
```

Abre `http://localhost:5000` — deberías ver: `JWT Auth API running`

---

## Conceptos clave

### Access token vs refresh token

| | Access token | Refresh token |
|---|-------------|---------------|
| **Duración** | 15 minutos | 7 días |
| **Uso** | Cada petición protegida | Solo para obtener un nuevo access token |
| **Almacenamiento** | Memoria del cliente (header `Authorization`) | Cookie httpOnly en el servidor |
| **Secreto** | `JWT_SECRET` | `REFRESH_TOKEN_SECRET` |

### Rotación de refresh tokens

Cada vez que llamas a `/api/auth/refresh`, el token anterior se **revoca** y se emite uno nuevo. Si un atacante roba un refresh token ya usado, no podrá reutilizarlo.

### Hash en base de datos

Los refresh tokens nunca se guardan en texto plano. Se almacena un hash SHA-256, de modo que una filtración de la base de datos no expone tokens válidos.

---

## Estructura del proyecto

```
Auth-Taller/
├── server.js              # Punto de entrada de Express
├── config/
│   └── db.js              # Conexión a MongoDB
├── models/
│   ├── user.js            # Modelo de usuario
│   └── refreshToken.js    # Modelo de refresh token
├── middleware/
│   └── auth.js            # Verificación del access token
├── routes/
│   ├── auth.js            # Registro, login, refresh, logout
│   └── profile.js         # Ruta protegida de perfil
└── utils/
    └── tokens.js          # Helpers para crear y rotar tokens
```

---

## Referencia de API

Base URL: `http://localhost:5000`

### POST `/api/auth/register`

Registra un nuevo usuario.

**Body (JSON):**
```json
{
  "username": "demoUser",
  "email": "demo@email.com",
  "password": "mypassword"
}
```

**Respuestas:**
- `201` — `{ "message": "User created successfully" }`
- `400` — `{ "message": "User already exists" }`

---

### POST `/api/auth/login`

Inicia sesión y devuelve un access token. El refresh token se envía como cookie httpOnly.

**Body (JSON):**
```json
{
  "email": "demo@email.com",
  "password": "mypassword"
}
```

**Respuesta `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Cookie:** `refresh_token` (httpOnly, path `/api/auth/refresh`)

---

### POST `/api/auth/refresh`

Obtiene un nuevo access token usando la cookie de refresh. Rota el refresh token automáticamente.

**Headers:** ninguno requerido (la cookie se envía sola)

**Respuesta `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores comunes:**
- `401` — `"No refresh token"`
- `401` — `"Invalid or expired refresh token"`
- `401` — `"Refresh token revoked"`

---

### POST `/api/auth/logout`

Revoca el refresh token actual y elimina la cookie.

**Respuesta `200`:**
```json
{
  "message": "Logged out"
}
```

---

### GET `/api/profile/me`

Devuelve el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Respuesta `200`:**
```json
{
  "user": {
    "_id": "...",
    "username": "demoUser",
    "email": "demo@email.com"
  }
}
```

**Errores:**
- `401` — `"Missing or invalid Authorization header"`
- `401` — `"Access token expired"`
- `401` — `"Invalid token"`
- `404` — `"User not found"`

---

## Guía de pruebas con Postman

### 1. Registrar un usuario

- **Método:** POST
- **URL:** `http://localhost:5000/api/auth/register`
- **Body:** raw JSON con `username`, `email` y `password`
- **Resultado esperado:** status `201`

### 2. Iniciar sesión

- **Método:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Body:** `{ "email": "...", "password": "..." }`
- Copia el valor de `accessToken` de la respuesta
- Postman guardará la cookie `refresh_token` automáticamente

### 3. Acceder a ruta protegida

- **Método:** GET
- **URL:** `http://localhost:5000/api/profile/me`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Resultado esperado:** datos del usuario sin el campo `password`

### 4. Probar errores de autenticación

| Prueba | Resultado esperado |
|--------|-------------------|
| Sin header `Authorization` | `401` — Missing or invalid Authorization header |
| Token inventado | `401` — Invalid token |
| Token expirado (esperar 15 min o cambiar TTL) | `401` — Access token expired |

### 5. Renovar el access token

- **Método:** POST
- **URL:** `http://localhost:5000/api/auth/refresh`
- No necesitas headers; Postman envía la cookie guardada en el paso 2
- **Resultado esperado:** nuevo `accessToken` en la respuesta

### 6. Cerrar sesión

- **Método:** POST
- **URL:** `http://localhost:5000/api/auth/logout`
- **Resultado esperado:** `{ "message": "Logged out" }`
- Intentar `/refresh` de nuevo debe devolver `401`

---

## Flujo del cliente (referencia)

```
Login → guardar accessToken en memoria
      → refresh_token queda en cookie httpOnly

Petición protegida → Authorization: Bearer <accessToken>

Si 401 "Access token expired":
  → POST /api/auth/refresh (cookie automática)
  → actualizar accessToken en memoria
  → reintentar petición original

Logout → POST /api/auth/logout → limpiar estado local
```

> No guardes el access token en `localStorage` — es vulnerable a XSS. Mantenlo en memoria.

---

## Notas de seguridad

- Usa **HTTPS** en producción (`secure: true` en cookies se activa con `NODE_ENV=production`)
- Mantén access tokens **cortos** (15 min) y refresh tokens **moderados** (7 días)
- **Rota** el refresh token en cada renovación
- **Hashea** refresh tokens antes de guardarlos en la base de datos
- Considera **rate limiting** en `/api/auth/refresh` en producción
- Rota tus secretos y contraseñas si alguna vez se exponen

---

## Referencia

- Artículo original: [How to Build a Secure Authentication System with JWT and Refresh Tokens](https://www.freecodecamp.org/news/how-to-build-a-secure-authentication-system-with-jwt-and-refresh-tokens/) — Joan Ayebola, FreeCodeCamp
