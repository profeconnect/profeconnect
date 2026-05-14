# AmigojoLive — Compose Multiplatform (Android + Web)

Cliente KMP con Kotlin, Jetpack Compose y Material Design 3 para las superficies Android y web (jsMain).

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| JDK | 17 |
| Android Studio | Hedgehog (2023.1.1+) |
| Android SDK | API 24 → 34 |
| Node.js | 20 (para webpack/jsMain) |
| Gradle | 8.10.2 (el wrapper lo descarga) |

## Configuración inicial

Importa en Android Studio la carpeta `composeApp/` directamente. No abras la raíz del monorepo si lo que quieres es sincronizar y ejecutar el cliente Android/KMP, porque el proyecto Gradle vive dentro de `composeApp/`.

```bash
# 1. Entrar al proyecto KMP
cd composeApp

# 2. Configurar la ruta del SDK de Android
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
# En Windows: sdk.dir=C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk
```

En Android Studio verifica además:

1. `File > Open` sobre `composeApp/`
2. Gradle JDK = `17`
3. Android SDK Platform = `34`
4. Sync de Gradle exitoso antes de ejecutar `MainActivity`

## Compilar y ejecutar

### Android

```bash
# Debug APK
./gradlew assembleDebug

# Instalar en dispositivo/emulador conectado
./gradlew installDebug

# Release AAB (requiere keystore configurado)
./gradlew bundleRelease
```

### Web (jsMain)

```bash
# Servidor de desarrollo con hot reload
./gradlew jsBrowserDevelopmentRun

# Bundle de producción → build/dist/js/productionExecutable/
./gradlew jsBrowserDistribution
```

### Tests comunes (MockEngine Ktor)

```bash
./gradlew allTests
```

## Estructura del proyecto

```
composeApp/
├── src/
│   ├── commonMain/kotlin/com/amigojolive/
│   │   ├── App.kt                      # Punto de entrada compartido + AppDeps
│   │   ├── core/
│   │   │   ├── network/                # Ktor + ApiResponse unwrap
│   │   │   ├── session/                # TokenStorage (expect) + SessionStore
│   │   │   └── socket/                 # ChatSocketService (expect)
│   │   ├── domain/
│   │   │   ├── model/                  # DTOs Kotlin alineados al backend
│   │   │   └── repository/             # Repositorios (lógica de negocio)
│   │   ├── navigation/                 # Voyager Screens + NavGraph docs
│   │   └── ui/
│   │       ├── theme/                  # MD3 Color + Type + Theme (expect)
│   │       ├── components/             # Componentes reutilizables M3
│   │       ├── auth/                   # Login · Registro · AuthViewModel
│   │       ├── home/                   # Dashboard docente + StatCards
│   │       ├── publications/           # Feed · Detalle · Crear/Editar
│   │       ├── profile/                # Perfil GET/PATCH
│   │       ├── chatbot/                # Chat streaming Socket.IO
│   │       └── admin/                  # Usuarios · Solicitudes · Categorías
│   ├── androidMain/kotlin/com/amigojolive/
│   │   ├── MainActivity.kt
│   │   ├── AmigojoApp.kt
│   │   ├── core/
│   │   │   ├── network/  HttpClientFactory → OkHttp
│   │   │   ├── session/  TokenStorage     → EncryptedSharedPreferences
│   │   │   └── socket/   ChatSocketService → Java socket.io-client
│   │   └── ui/theme/     Theme.android.kt  → Material You (Android 12+)
│   └── jsMain/kotlin/com/amigojolive/
│       ├── main.kt        (CanvasBasedWindow)
│       └── core/
│           ├── network/   HttpClientFactory → Ktor-JS
│           ├── session/   TokenStorage      → localStorage
│           └── socket/    SocketIODeclarations.kt + ChatSocketService.js.kt
│                          (@JsModule("socket.io-client") + external)
└── src/commonTest/        Tests con MockEngine Ktor
```

## Variables de entorno (frontend)

| Variable | Valor por defecto |
|---|---|
| `BASE_URL` | `http://localhost:3000/api/v1` |
| Socket namespace | `/chatbot` |

Para producción, cambiar `BASE_URL` en `ApiService.kt` o inyectarla vía configuración de build.

## Notas de arquitectura

- **Navegación**: Voyager (elegido sobre Navigation Compose por mejor soporte web).
- **Socket.IO**: `expect/actual` — cliente Java en Android, NPM vía `@JsModule` en JS (no se reimplementa el protocolo).
- **wasmJs**: pendiente como mejora opcional una vez que Socket.IO y multipart estén estables en jsMain.
- **FileKit/Peekaboo**: integración pendiente para selección de archivos multiplataforma; la lógica de multipart en `ApiService.kt` está lista.
- **Backend**: sin cambios; rutas `/api/v1`, Socket `/chatbot`, envoltorio `ApiResponse`.
