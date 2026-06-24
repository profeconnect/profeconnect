# ProfeConnect

Red pedagógica colaborativa exclusiva para docentes de la red educativa **Fe y Alegría**. Permite compartir recursos, experiencias de aula y materiales de forma profesional o anónima, fomentando el aprendizaje entre pares.

**Producción:** [https://profeconnect.up.railway.app](https://profeconnect.up.railway.app)

---

## Tabla de contenidos

1. [Descripción](#1-descripción)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del proyecto](#3-arquitectura-del-proyecto)
4. [Modelos de base de datos](#4-modelos-de-base-de-datos)
5. [Funcionalidades principales](#5-funcionalidades-principales)
6. [Endpoints de la API](#6-endpoints-de-la-api)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Arranque local](#8-arranque-local)
9. [Despliegue en producción (Railway)](#9-despliegue-en-producción-railway)
10. [Plan de pruebas](#10-plan-de-pruebas)

---

## 1. Descripción

ProfeConnect es una plataforma web privada orientada a docentes. Solo los usuarios con correo institucional verificado o cédula aprobada por un administrador pueden acceder. Sus características clave son:

- Publicación de recursos pedagógicos con adjuntos (imágenes, PDF, Excel).
- Feed de publicaciones con reacciones, comentarios y filtrado por categorías.
- Chatbot con IA integrado (compatible con la API de OpenAI/DeepSeek).
- Sistema de solicitudes de registro con verificación por correo o revisión manual de cédula.
- Panel de administración para gestión de usuarios, solicitudes e incidentes de seguridad.
- Reseñas de la plataforma por parte de los docentes.
- Analítica con Google Analytics 4.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Estilos | Tailwind CSS 4 |
| Backend | Node.js + Express 5 |
| ORM / Base de datos | Prisma + PostgreSQL |
| Almacenamiento de archivos | Supabase Storage |
| Autenticación | JWT (jsonwebtoken) |
| Tiempo real | Socket.io |
| Correo electrónico | Nodemailer + Gmail SMTP |
| Inteligencia Artificial | DeepSeek / OpenAI API compatible |
| Analítica | Google Analytics 4 |
| Infraestructura | Railway (backend + frontend) |

---

## 3. Arquitectura del proyecto

El repositorio es un **monorepo** con tres partes:

```
profeconnect/
├── backend/          # API REST + WebSocket (Node.js / Express)
│   ├── prisma/       # Esquema de BD y migraciones
│   └── src/
│       ├── modules/  # auth, publications, comments, chatbot, users...
│       ├── middlewares/
│       ├── lib/      # prisma, supabase, email, IA, storage
│       └── routes/v1/
├── frontend/         # SPA React (Vite)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── api/      # Servicios HTTP
│       └── context/
├── docker-compose.yml  # PostgreSQL local para desarrollo
└── package.json        # Scripts del monorepo
```

---

## 4. Modelos de base de datos

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `User` | `usuarios` | Docentes y administradores |
| `TeacherProfile` | `perfiles_docente` | Área, descripción y foto del docente |
| `RegistrationRequest` | `solicitudes_registro` | Solicitudes de acceso pendientes de aprobación |
| `Post` | `publicaciones` | Publicaciones del feed |
| `PostAttachment` | `adjuntos_publicacion` | Archivos adjuntos a publicaciones |
| `PostReaction` | `reacciones_publicacion` | LIKE, USEFUL, LOVE por usuario |
| `Comment` | `comentarios` | Comentarios en publicaciones |
| `Tag` | `etiquetas` | Categorías de publicaciones |
| `Reports` | `reportes` | Reportes de publicaciones inapropiadas |
| `SecurityIncident` | `incidentes_seguridad` | Archivos sospechosos detectados |
| `PlatformReview` | `reseñas_plataforma` | Reseñas de los docentes sobre la plataforma |
| `Role` | `roles` | Roles del sistema (docente, administrador) |

---

## 5. Funcionalidades principales

### Para docentes
- Registro con correo institucional (verificación por email) o cédula de identidad (revisión manual).
- Publicar recursos con título, contenido, categorías y archivos adjuntos (JPG/PNG hasta 2 MB; PDF/Excel hasta 10 MB).
- Publicar de forma anónima.
- Reaccionar y comentar publicaciones (opcionalmente de forma anónima).
- Chatbot pedagógico con IA disponible en todo momento.
- Reportar publicaciones inapropiadas.
- Editar y eliminar sus propias publicaciones.
- Dejar una reseña sobre la plataforma.

### Para administradores
- Aprobar o rechazar solicitudes de registro con comentario.
- Ver y gestionar todos los usuarios (activar, bloquear).
- Revisar incidentes de seguridad (archivos con MIME type adulterado).
- Ver el panel de reseñas de la plataforma.

---

## 6. Endpoints de la API

Base URL local: `http://localhost:3000/api/v1`  
Base URL producción: `https://profeconnect-backend.up.railway.app/api/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/register-request` | Solicitar acceso como docente |
| `GET` | `/auth/verify-email` | Verificar correo institucional |
| `GET` | `/publications` | Feed de publicaciones |
| `POST` | `/publications` | Crear publicación (multipart/form-data) |
| `PUT` | `/publications/:id` | Editar publicación |
| `DELETE` | `/publications/:id` | Eliminar publicación |
| `POST` | `/publications/:id/comments` | Comentar |
| `POST` | `/publications/:id/reactions` | Reaccionar |
| `GET` | `/categories` | Listar categorías/etiquetas |
| `GET` | `/users` | Listar usuarios (admin) |
| `GET` | `/registration-requests` | Solicitudes pendientes (admin) |
| `PUT` | `/registration-requests/:id` | Aprobar/rechazar solicitud (admin) |
| `GET` | `/incidents` | Incidentes de seguridad (admin) |
| `GET` | `/reviews` | Reseñas de la plataforma |
| `POST` | `/reviews` | Crear reseña |
| `GET` | `/health/db` | Verificar conexión a la base de datos |

El chatbot funciona por **WebSocket** (`/chatbot`) usando Socket.io.

---

## 7. Variables de entorno

### `backend/.env` (copiar desde `backend/.env.example`)

```env
# Base de datos (Supabase / PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

# JWT
JWT_SECRET="clave-secreta-segura"
JWT_EXPIRES_IN="1d"

# Administrador inicial (seed)
ADMIN_EMAIL="admin@institucion.edu.ec"
ADMIN_PASSWORD="TuPasswordSeguro"

# Servidor
PORT=3000
FRONTEND_URL="http://localhost:5173"

# Chatbot (API compatible con OpenAI)
CHATBOT_API_KEY="sk-tu-api-key"

# Correo transaccional (Gmail SMTP)
GMAIL_USER="tucorreo@gmail.com"
GMAIL_APP_PASSWORD="tu-contrasena-de-aplicacion"
EMAIL_FROM_NAME="ProfeConnect"
EMAIL_TEST_MODE=true
EMAIL_TEST_TO_EMAIL="tucorreo@gmail.com"
EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=24

# Dominios institucionales permitidos para registro
ALLOWED_INSTITUTIONAL_DOMAINS="educacion.gob.ec"

# Supabase Storage
SUPABASE_URL="https://TU_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
SUPABASE_PUBLIC_BUCKET="publication-files"
SUPABASE_PRIVATE_BUCKET="private-files"
```

### `frontend/.env` (copiar desde `frontend/.env.example`)

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000

# Google Analytics 4 (opcional)
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_GA_ENABLED=false
VITE_GA_DEBUG=false
```

> **Nunca subas archivos `.env` al repositorio.** Ambos están listados en `.gitignore`.

---

## 8. Arranque local

### Requisitos previos

- Node.js >= 18
- Docker Desktop (para la base de datos local)
- npm >= 9

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/GoldenKra64/profeconnect.git
cd profeconnect

# 2. Levantar PostgreSQL local
docker compose up -d postgres

# 3. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# 4. Instalar dependencias, aplicar migraciones y cargar datos iniciales
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
cd ..

# 5. Instalar dependencias del frontend
cd frontend
npm install
cp .env.example .env
# Editar frontend/.env si es necesario
cd ..

# 6. Iniciar backend (puerto 3000) y frontend (puerto 5173) en terminales separadas
npm run backend   # http://localhost:3000
npm run frontend  # http://localhost:5173
```

### Verificar conexión a la base de datos

```
GET http://localhost:3000/api/v1/health/db
```

Debe devolver un JSON con estado positivo.

### Solución de problemas comunes

**Error de autenticación en PostgreSQL (`28P01`):** existe un volumen Docker con otra contraseña. Ejecutar:

```bash
docker compose down -v
docker compose up -d postgres
```

Luego volver a aplicar migraciones y seed.

---

## 9. Despliegue en producción (Railway)

El proyecto está desplegado en [Railway](https://railway.app) con dos servicios:

| Servicio | URL |
|----------|-----|
| Frontend | [https://profeconnect.up.railway.app](https://profeconnect.up.railway.app) |
| Backend | `https://profeconnect-backend.up.railway.app` |

Las variables de entorno de producción se configuran directamente en el panel de Railway. No se usan archivos `.env` en el servidor.

El comando de build configurado en `render.yaml` / Railway es:

```bash
npm run build
```

Y el de inicio:

```bash
npm run start
```

---

## 10. Plan de pruebas

| Tipo | Descripción |
|------|-------------|
| **Caja negra** | Validación de respuestas de la API según las entradas del usuario (campos requeridos, formatos, permisos por rol) |
| **Caja blanca** | Revisión de lógica interna: validaciones Zod en DTOs, middlewares de autenticación y autorización, detección de MIME types adulterados |
| **Pruebas de integración** | Flujo completo de registro → verificación de correo → aprobación → login → publicación → reacción |
| **Pruebas de seguridad** | Subida de archivos con extensión adulterada, acceso a rutas protegidas sin JWT, intentos de escalada de privilegios |
| **Pruebas responsive** | Formularios y modales en dispositivos móviles (viewport < 768px) |

---

## Contribuidores

Proyecto desarrollado como plataforma colaborativa para la red educativa Fe y Alegría.

- Grupo de desarrollo — **2026**
