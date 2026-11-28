# Registro de pruebas — EcoRuta

Responsable: **Integrante 7 — Calidad y evidencia**
Fecha: **2026-11-23**
Rama: `Dev` · commit base `37f1a35` + cambios de pruebas (Vitest/Supertest) sin publicar.
Entorno: Windows, Node 26.13.1, npm 11.20.0, PostgreSQL 17.12 local (puerto 5433).

## 1. Pruebas automáticas

Comando:

```bash
cd backend
npm install
npm test
```

Herramientas: **Vitest** (runner) y **Supertest** (peticiones HTTP), más `node:assert` en las
pruebas heredadas. La capa `pg` se simula, así que **no se necesita base de datos** para la suite
principal.

### Resultado de la ejecución

| Escenario | Archivos | Pruebas | Fallos | Duración |
|---|---|---|---|---|
| Sin base (solo simulación de `pg`) | 6 (5 ejecutados, 1 omitido) | 56 (54 aprobadas, 2 omitidas) | 0 | ~1,5 s |
| Con base real (`TEST_DATABASE_URL`) | 6 ejecutados | **56 aprobadas** | 0 | ~1,4 s |

Las 2 pruebas de integración crean un usuario temporal, validan login y perfil contra PostgreSQL y
lo eliminan al terminar. Con `TEST_DATABASE_URL` definida, la suite completa queda en **56/56**.

### Casos cubiertos

| Archivo | Casos |
|---|---|
| `tests/api-auth.test.js` | Login 200 con JWT válido, alias `email`/`password`, 401 por contraseña incorrecta, 401 por correo inexistente con el mismo mensaje, 400 por formato y por campo faltante, 403 cuenta inactiva, 500 sin `JWT_SECRET`; panel 401 sin token, 401 token inválido, 403 rol no admin; sin consultar la base en los rechazos |
| `tests/auth-controller.test.js` | Login/logout/perfil a nivel de controlador (401, 403, 200, payload del token) |
| `tests/auth-unit.test.js` | Esquema Zod, bcrypt (RNF-01), `autenticar` (RNF-02) y `soloAdmin` (RF-04) |
| `tests/dashboard.test.js` | 401/403/400/503, 18 indicadores numéricos, filtros de `servicios-hoy` con parámetros, CORS y JSON mal formado |
| `tests/app.test.js` | CORS en producción y desarrollo, error de JSON mal formado |
| `tests/integracion-neon.test.js` | Integración real con PostgreSQL (se omite si no hay `TEST_DATABASE_URL`) |

## 2. Pruebas manuales

Servidor: `cd backend && npm run dev` con `backend/.env` apuntando a la base local (sección 4).

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido | Fecha | Estado |
|---|---|---|---|---|---|---|
| M-01 | Salud de la API | `GET /api/health` | 200 con `estado: "ok"` | 200 `{ estado: "ok", servicio: "EcoRuta API Backend", fecha }` | 2026-11-23 | Aprobado |
| M-02 | Panel sin token | `GET /api/admin/dashboard-resumen` sin `Authorization` | 401 con mensaje en español | 401 `{ error: "No autorizado", mensaje: "...token Bearer..." }` | 2026-11-23 | Aprobado |
| M-03 | Token inválido | `GET /api/admin/servicios-hoy` con `Bearer token.falso.123` | 401 `Token inválido` | 401 `{ error: "Token inválido", mensaje: "...inválido o ha sido alterado." }` | 2026-11-23 | Aprobado |
| M-04 | JSON mal formado | `POST /api/auth/login` con `{malo` | 400 `JSON inválido` | 400 `{ error: "JSON inválido", mensaje: "...comillas, comas y llaves..." }` | 2026-11-23 | Aprobado |
| M-05 | Login correcto | `POST /api/auth/login` con `admin@ecoruta.co` | 200 con token JWT | **200** `{ mensaje, token, usuario }`; JWT de 237 caracteres | 2026-11-23 | Aprobado |
| M-06 | Login incorrecto | `POST /api/auth/login` con contraseña errada | 401 `Credenciales incorrectas` | **401** `{ error: "Credenciales incorrectas", mensaje: "Correo o contraseña incorrectos..." }` | 2026-11-23 | Aprobado |
| M-07 | Dashboard con sesión | Login, luego `GET /api/admin/dashboard-resumen` con el token | 200 con los 18 indicadores | **200** `{ mensaje, datos }` con los **18** campos: 5 vehículos, 4 conductores, 4 rutas, 2 localidades, 12 comunas, 104 barrios | 2026-11-23 | Aprobado |
| M-08 | Servicios de hoy con filtros | `GET /api/admin/servicios-hoy?zona=Isla&estado=en_curso` | 200 con la lista filtrada | **200** con 1 servicio (`Ruta 1 · Centro`, `TUR101`, `en_curso`); `estado=conflicto` devuelve 0 | 2026-11-23 | Aprobado |

**Nota sobre M-08:** el seed carga programaciones del 1 al 31 de diciembre, así que el día de la
prueba no había servicios. Para validar la consulta se creó una programación temporal para hoy
(turno Mañana, día lunes), se verificó la respuesta y se eliminó; los datos del seed quedaron
intactos. Las respuestas completas están en `docs/evidencia/`.

## 3. Vehículos y conductores (RNF-16): API pendiente, base verificada

Los casos de **crear vehículo, placa repetida, documento repetido y licencia repetida** no se
pueden ejecutar porque **la API de vehículos y conductores no existe todavía**.

Verificación hecha el 2026-11-23 sobre todas las ramas del remoto:

| Rama | Rutas/controladores de vehículos o conductores |
|---|---|
| `Dev` | No |
| `main` | No |
| `feature/ECO-4-login-dashboard` | No |
| `feature/ECO-12-endpoints-dashboard` | No |
| `feature/ECO-18-perimetro-urbano` | No |
| `feature/ECO-2-migraciones-base-de-datos` | No |
| `feat/frontend-base` | No |

Solo existen las tablas y sus restricciones (`database/migrations/…002` y `…003`):
`vehiculos.placa UNIQUE`, `conductores.documento UNIQUE`, `conductores.numero_licencia UNIQUE`.

Cuando el equipo publique los endpoints, las pruebas deben cubrir:

1. `POST /api/admin/vehiculos` con datos válidos → **201** y vehículo creado.
2. Repetir la misma `placa` → **409** (o 400) con mensaje que mencione la placa, sin duplicar.
3. `POST /api/admin/conductores` con datos válidos → **201**.
4. Repetir `documento` → **409/400** con mensaje que mencione el documento.
5. Repetir `numero_licencia` → **409/400** con mensaje que mencione la licencia.

### Lo que sí se verificó (directo en la base)

Como la API no existe, se probaron las restricciones `UNIQUE` con `INSERT` reales contra la base y
luego se revirtió todo (nada quedó duplicado). Evidencia en
`docs/evidencia/m-09-rnf16-restricciones.json`.

| Caso | Resultado |
|---|---|
| Insertar un vehículo con la misma `placa` | Rechazado: `23505`, restricción `vehiculos_placa_key` |
| Insertar un conductor con el mismo `documento` | Rechazado: `23505`, restricción `conductores_documento_key` |
| Insertar un conductor con el mismo `numero_licencia` | Rechazado: `23505`, restricción `conductores_numero_licencia_key` |

Esto demuestra el lado de la base de **RNF-16** (no admite duplicados). Falta el lado de la API
(código HTTP y mensaje para el usuario), que depende de los endpoints.

## 4. Base de pruebas

### 4.1 Neon: rama `test` creada (no alcanzable desde esta red)

Sí se creó la rama **`test`** en el proyecto `ecoruta` de Neon (pg 18, región `aws-sa-east-1`), a
partir de `production`, con endpoint propio. Pero **este PC no puede conectarse a PostgreSQL por
internet**: la red bloquea el puerto **5432**. Se comprobó así:

| Destino | Puerto 443 | Puerto 5432 |
|---|---|---|
| Host de Neon (rama `test`) | Abierto | **Timeout** |
| `portquiz.net` (prueba genérica) | Abierto | **Timeout** |
| `speedtest.cl` | Abierto | **Timeout** |

Al ser un bloqueo de red y no de credenciales, no se pudo usar Neon para las pruebas de hoy. La rama
queda disponible para el equipo (y para ejecutar la suite desde otra red).

### 4.2 PostgreSQL 17.12 local (lo usado en esta entrega)

Sin permisos de administrador se usaron los binarios portables del paquete npm
`@embedded-postgres/windows-x64`, en una carpeta temporal:

```powershell
$base = "$env:TEMP\opencode\pglocal"
$bin  = "$base\node_modules\@embedded-postgres\windows-x64\native\bin"

# 1) crear el cluster (una sola vez)
& "$bin\initdb.exe" -D "$base\data" -U postgres --auth=trust -E UTF8 --no-locale

# 2) arrancar en el puerto 5433
& "$bin\pg_ctl.exe" -D "$base\data" -l "$base\servidor.log" -o "-p 5433 -c listen_addresses=127.0.0.1" start

# 3) detener
& "$bin\pg_ctl.exe" -D "$base\data" stop
```

La base `ecoruta` se creó vacía y luego se aplicó, en `backend/`:

```bash
npm run migrate up    # 15 migraciones: tablas, vistas, funciones y triggers
npm run seed          # geografía real de Buenaventura + datos de prueba
npm run crear-admin   # admin@ecoruta.co con la clave de .env
```

`backend/.env` (ignorado por git) quedó con:

```env
DATABASE_URL=postgresql://postgres@127.0.0.1:5433/ecoruta?sslmode=disable
JWT_SECRET=<aleatorio generado en este PC>
```

### 4.3 Suite de integración

```powershell
$env:TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:5433/ecoruta?sslmode=disable"
npm test
```

Con esa variable, `tests/integracion-neon.test.js` deja de omitirse: crea un usuario temporal,
valida login y perfil, y lo elimina. Resultado: **56/56 pruebas aprobadas**. El nombre del archivo
se mantiene por compatibilidad, pero funciona con cualquier PostgreSQL alcanzable (local o Neon).

## 5. Evidencia

| Archivo | Contenido |
|---|---|
| `docs/evidencia/m-05-login-200.json` | Respuesta del login correcto (incluye el JWT de la sesión de prueba) |
| `docs/evidencia/m-06-login-401.json` | Respuesta del login con contraseña errada |
| `docs/evidencia/m-07-dashboard-200.json` | Los 18 indicadores del panel con datos reales |
| `docs/evidencia/m-08-servicios-hoy-200.json` | Servicios de hoy (1 registro `en_curso`) |
| `docs/evidencia/m-08b-servicios-hoy-filtrado-200.json` | Mismo endpoint con `zona=Isla&estado=en_curso` |
| `docs/evidencia/m-08c-servicios-hoy-vacio-200.json` | Filtro `estado=conflicto` → lista vacía |
| `docs/evidencia/m-09-rnf16-restricciones.json` | Rechazos `23505` de placa, documento y licencia repetidos |
| `docs/evidencia/entrega-1/equipo/*.jpg` | 12 capturas de apoyo enviadas por el integrante de ECO-12: demo de los endpoints contra Neon `dev` y consultas de verificación en el SQL Editor |

### Evidencia de apoyo del equipo

Las capturas de `docs/evidencia/entrega-1/equipo/` las tomó el integrante de **ECO-12** en su equipo,
contra la rama `dev` de Neon, el 2026-11-23. Confirman login, los 18 indicadores, los 400/401 y que
las 15 migraciones y el seed están aplicados. El detalle de cada archivo está en el `README.md` de
esa carpeta.

No sustituyen la evidencia de la URL pública: no muestran interfaz, mapa, vehículos, conductores,
rutas, programación ni simulación.

> El JWT de `m-05` expira en 8 horas y se emitió con el `JWT_SECRET` local de este PC; no sirve
> fuera de él.

## 6. Cómo reproducir

```bash
cd backend
npm install
npm test            # suite principal, sin base de datos
npm test -- --watch # modo interactivo (o npm run test:watch)
```

Para la API en vivo: `npm run dev` y luego `npm run test:live` en otra terminal (requiere `.env`
con `DATABASE_URL` y un administrador creado con `npm run crear-admin`).

Con la base local arrancada (sección 4.2), todos los comandos de esta página funcionan tal cual.

## 7. Prueba desde cero del README (ECO-35)

Prueba de «Cómo ejecutar el proyecto» hecha el 2026-11-23 por Rubén Alberto Camacho Benitez (@RCamaB22): rama `Dev` clonada en una carpeta nueva, base PostgreSQL vacía (rama nueva en Neon, conexión directa sin `-pooler`) y Node.js 22.

| Paso | Comando | Resultado esperado | Estado |
|---|---|---|---|
| Migraciones | `npm run migrate up` | 15 migraciones y `Migrations complete!` | Aprobado |
| Datos de prueba | `npm run seed` | `Datos de prueba listos.` | Aprobado |
| Administrador | `npm run crear-admin` | `Administrador listo: <correo>` | Aprobado |
| Suite | `npm test` | Vitest sin fallos (sin `TEST_DATABASE_URL`, las 2 de integración se omiten) | Aprobado |
| API en vivo | `npm run test:live` | 8 pasos con `OK` | Aprobado |
| Interfaz | Login, clave incorrecta, ruta protegida y cierre de sesión en `http://localhost:5173` | Coincide con «Verificación del acceso administrativo» | Aprobado |

Problemas que aparecieron al seguir el README y su solución:

| Problema | Causa | Solución |
|---|---|---|
| `The DATABASE_URL environment variable is not set` al correr `npm run migrate up` | El `.env` estaba en la raíz y los scripts solo lo leen desde `backend/` | Moverlo a `backend/.env`; el README del backend quedó corregido |
| `Los datos de prueba ya existen` al repetir `npm run seed` | La base ya tenía los datos | `npm run seed -- --reset` (no borra el administrador) |
| Aviso `SECURITY WARNING` de `pg` al conectar con Neon | La cadena usa `sslmode=require` | No impide nada; se quita con `sslmode=verify-full` |
