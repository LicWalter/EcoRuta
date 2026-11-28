# EcoRuta (antes Tura Limpia)

Aplicación web para gestionar y consultar la recolección de basura en Buenaventura. El administrador registra vehículos, conductores, barrios y rutas con su trazado en el mapa, y programa los servicios. El ciudadano consulta cuándo pasa el camión por su barrio.

**Equipo:** Empresa 4 · Seminario de Actualización I · Ingeniería de Sistemas · Universidad del Pacífico

> El proyecto se llamaba **Tura Limpia** y el equipo lo renombró **EcoRuta**. La lista de chequeo del profesor sigue usando el nombre original.

## Alcance

1. **Panel administrativo (entregas del profesor):** acceso de administrador, vehículos, conductores, barrios, rutas con mapa, turnos y programación, dashboard.
2. **Simulación de camiones (propia):** dos camiones virtuales recorren el trazado guardado y envían su posición a un endpoint, como lo haría un GPS real.
3. **Panel ciudadano (propio):** página pública y de solo lectura donde se elige el barrio y se ven rutas, horarios, puntos de recolección y, si hay un servicio en curso, el camión y una hora estimada de paso.

## Integrantes y responsabilidades

| # | Rol | Responsable de | Integrante | GitHub |
|---|-----|----------------|------------|--------|
| 1 | Líder y coordinación | Repositorio, README, releases, revisión de pull requests y evidencia | Victor Manuel Vera Angulo | @VictorManuelVera |
| 2 | Backend 1 (líder de backend) | Autenticación, seguridad, vehículos, endpoint de posiciones y simulación | Andres Fernando Fernández Riascos | @AFdez11 |
| 3 | Backend 2 | Conductores, barrios, rutas, programación, validaciones e indicadores | Rubén Alberto Camacho Benitez | @RCamaB22 |
| 4 | Base de datos y despliegue | PostgreSQL en Neon, migraciones, datos de prueba y publicación | Victor Manuel Vera Angulo | @VictorManuelVera |
| 5 | Frontend 1 (líder de frontend) | Login, dashboard, vehículos, barrios y rutas | Walter David Estupiñán Castillo | @LicWalter |
| 6 | Frontend 2 | Proyecto base del frontend, conductores, mapa, programación y simulación en el mapa | Johan Alexander Murillo Sinisterra | @johanmurillo067-prog |
| 7 | Calidad y evidencia | Pruebas, capturas, instrucciones de verificación y video | Jhon Leyner Orobio Paredes | @Dancenot0 |
| 8 | Panel ciudadano | Diseño y construcción del panel ciudadano y puntos de recolección | Luis David Arias Isaza | @PapiBufff |

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React con HTML y CSS (componentes JSX), Vite y React Router |
| Estilos | Tailwind CSS o CSS propio (por elegir) |
| Mapa | Leaflet y React Leaflet, con mapas de OpenStreetMap, centrado en Buenaventura |
| Backend | Node.js con Express (API REST) |
| Acceso a datos | pg (node-postgres) y node-pg-migrate para las migraciones |
| Seguridad | JWT para la sesión, bcrypt para las contraseñas y Zod para validar los datos |
| Base de datos | PostgreSQL alojado en Neon (migraciones que crean la base desde cero) |
| Pruebas | Vitest y Supertest para los endpoints; registro de pruebas manuales en `docs/pruebas.md` |
| Despliegue | Netlify (frontend) y Render (backend) |

**Sobre el frontend:** React no reemplaza a HTML ni a CSS, los organiza en componentes. Cada componente devuelve etiquetas HTML escritas en JSX, y los estilos siguen siendo CSS. Hay un solo `index.html` y React cambia lo que se muestra en cada pantalla.

## Estructura del repositorio

```
backend/              API y lógica de negocio
frontend/             Interfaz web (panel administrativo y panel ciudadano)
database/migrations/  Migraciones que crean la base de datos desde cero
database/seeds/       Datos de prueba o script de carga
docs/evidencia/       Capturas y videos de cada entrega
.github/              Plantilla de pull request
```

## Cómo ejecutar el proyecto

Probado desde cero con una base de datos vacía, clonando la rama `Dev` en una carpeta nueva (ECO-35).

### 1. Requisitos

- Node.js LTS (probado con la versión 22) y npm.
- Git.
- Una base PostgreSQL vacía: una rama nueva en Neon o PostgreSQL instalado en el equipo.
- Visual Studio Code con la extensión Thunder Client (opcional, para probar a mano).

### 2. Clonar el repositorio

```bash
git clone -b Dev https://github.com/EcoRuta-E4/EcoRuta.git
cd EcoRuta
```

### 3. Crear la base de datos

**En Neon:** crear una rama nueva (por ejemplo `prueba-local`), entrar a **Connect** y copiar la cadena de conexión con la opción **Connection pooling desactivada**. La cadena directa no lleva `-pooler` en el host. Debe terminar en `?sslmode=require`.

**En PostgreSQL local:**

```sql
CREATE DATABASE ecoruta;
```

### 4. Variables de entorno del backend

El archivo `.env` va dentro de `backend/`. Los scripts se ejecutan desde esa carpeta y no leen un `.env` en la raíz.

```bash
cd backend
cp ../.env.example .env
```

En Windows (CMD) se usa `copy ..\.env.example .env`.

Abrir `backend/.env` y cambiar como mínimo:

- `DATABASE_URL`: la cadena directa de Neon o `postgresql://usuario:contrasena@localhost:5432/ecoruta` si es local.
- `JWT_SECRET`: cualquier texto largo.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: correo y clave del administrador inicial (la clave con 8 caracteres o más).

El `.env` nunca se sube a GitHub (ya está en `.gitignore`).

### 5. Instalar, migrar, cargar datos y crear el administrador

Todo desde `backend/`:

```bash
npm install
npm run migrate up      # crea las tablas, vistas y funciones (15 migraciones)
npm run seed            # carga la geografía y los datos de prueba
npm run crear-admin     # crea o actualiza el administrador del .env
```

Cada comando termina con `Migrations complete!`, `Datos de prueba listos.` y `Administrador listo: <correo>`.

Para volver a cargar los datos de prueba sobre una base que ya los tiene: `npm run seed -- --reset` (no borra el administrador).

### 6. Iniciar el backend y probarlo

```bash
npm run dev             # http://localhost:3000
```

En otra terminal, también desde `backend/`:

```bash
npm test                # suite de Vitest (ver «Cómo correr las pruebas»)
npm run test:live       # login, perfil, rutas protegidas, dashboard y logout contra la base del .env
```

`npm run test:live` debe mostrar los 8 pasos con `OK`. Para probar a mano, importar `backend/thunder-collection_ecoruta_auth.json` en Thunder Client, ejecutar el login con el correo y la clave del `.env` y pegar el token en el encabezado `Authorization: Bearer <token>` de las demás peticiones. `GET http://localhost:3000/api/health` responde `{"estado":"ok", ...}`.

### 7. Iniciar el frontend

Con el backend corriendo, en otra terminal:

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:3000
npm run dev             # http://localhost:5173
```

Entrar a `http://localhost:5173/login` con el administrador creado en el paso 5.

### Problemas encontrados al probar

| Problema | Causa | Solución |
|---|---|---|
| `The DATABASE_URL environment variable is not set` al correr `npm run migrate up` | El `.env` estaba en la raíz del repositorio | Moverlo a `backend/.env` |
| `Los datos de prueba ya existen` al repetir `npm run seed` | La base ya tenía los datos | `npm run seed -- --reset` |
| Aviso `SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'` al conectar con Neon | Mensaje de la librería `pg` por usar `sslmode=require` en la cadena | No impide nada; se puede quitar cambiando el final de la cadena a `?sslmode=verify-full` |

## Cómo correr las pruebas

El backend usa **Vitest** y **Supertest**. La suite principal simula PostgreSQL, así que no necesita base de datos.

```bash
cd backend
npm install
npm test            # ejecuta toda la suite
npm run test:watch  # modo interactivo
```

Resultado actual: **56 pruebas aprobadas** contra una base real (54 si se corre sin base; las 2 de integración se omiten).

Cubre:

- login correcto e incorrecto, cuenta inactiva, validación de datos y falta de `JWT_SECRET`;
- rutas del panel sin token (401), token inválido (401) y rol distinto de administrador (403);
- dashboard: indicadores, servicios de hoy, filtros y 503 cuando faltan migraciones;
- CORS y JSON mal formado.

Con PostgreSQL real (rama `test` de Neon o una base local) para no tocar los datos de `dev`:

```powershell
$env:TEST_DATABASE_URL="postgresql://usuario:clave@host:puerto/ecoruta?sslmode=require"
npm test
```

El registro detallado (paso, resultado esperado, resultado obtenido y fecha) está en
[`docs/pruebas.md`](docs/pruebas.md), con las respuestas guardadas en `docs/evidencia/`.
Las pruebas de vehículos y conductores (RNF-16) quedan pendientes como API porque esos endpoints
todavía no existen en `Dev`; la base sí está verificada (rechaza placa, documento y licencia
duplicados con `23505`).

## Verificación del acceso administrativo

1. Abrir `http://localhost:5173/login`.
2. Probar una contraseña incorrecta: aparece «Correo o contraseña incorrectos» y no se crea sesión.
3. Entrar con las credenciales correctas: se abre `/dashboard` con el menú (Vehículos, Conductores, Barrios y Rutas, Mapa de Rutas, Programación y Simulación) y los indicadores del backend.
4. Pulsar «Cerrar sesión»: se borra el token y la aplicación vuelve a `/login`.
5. Sin sesión, abrir `http://localhost:5173/dashboard`: redirige a `/login` con el aviso «Inicia sesión para continuar».

Las capturas de esta verificación están en [`docs/evidencia/entrega-1/`](docs/evidencia/entrega-1/README.md).

## URLs públicas

- Frontend: _pendiente (obligatoria desde la entrega 3)_
- Backend: _pendiente (obligatoria desde la entrega 3)_

Las credenciales de demostración se envían por Teams el día de cada cierre.

## Entregas y releases

| Entrega | Contenido | Cierre | Release | Estado |
|---------|-----------|--------|---------|--------|
| 1 | Acceso administrativo | lun 23 nov 2026 | `semana-1` | Entregada |
| 2 | Vehículos, conductores y dashboard | lun 30 nov 2026 | `semana-2` | Pendiente |
| 3 | Rutas, mapa y primera URL pública | lun 7 dic 2026 | `semana-3` | Pendiente |
| 4 | Programación y cierre | lun 14 dic 2026 | `semana-4` | Pendiente |

Los cierres son a las 11:59 p. m. y no se aceptan cambios posteriores.

## Cómo trabajamos

Ramas por tarea y pull requests, cada integrante desde su propia cuenta de GitHub. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Limitaciones y trabajo pendiente

_Se completa en la entrega 4._ Funciones previstas para el próximo semestre: GPS físico (rastreadores comerciales o Arduino con ESP32) con servidor Traccar, cuentas de ciudadanos con notificaciones, aplicación móvil nativa y hora estimada de paso que considere el tráfico.
