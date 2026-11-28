# EcoRuta — Backend API

Módulo de servidor y API REST para EcoRuta (Seminario de Actualización I · Universidad del Pacífico).

## 1. Alcance implementado (ECO-3)

- **RF-01 & RF-03:** Login y logout con token JWT generado y validado en el backend.
- **RF-02:** Mensaje comprensible con credenciales incorrectas.
- **RF-04:** Rutas del panel protegidas y validación de permisos de administrador (`autenticar`, `soloAdmin`).
- **RF-05:** Script `npm run crear-admin` para crear o actualizar el administrador inicial.
- **RNF-01:** Contraseñas hasheadas con `bcrypt`.
- **RNF-02:** Sesión/token JWT con vencimiento (configurable, por defecto `8h`).

## 1.1 Dashboard con datos reales (ECO-12)

- **RF-22 a RF-24:** `GET /api/admin/dashboard-resumen` y `GET /api/admin/servicios-hoy` leen los indicadores y los servicios del día desde PostgreSQL (Neon). Nada se escribe a mano.
- La lógica vive en la migración `1795219200015_dashboard-servicios-hoy.sql` (vista `v_rutas_sector` y funciones `fn_programaciones_en_curso`, `fn_servicios_hoy` y `fn_dashboard_resumen`). Antes de probar, ejecuta `npm run migrate up`.
- **Zona horaria:** "hoy" y "ahora" se calculan en `America/Bogota`. Neon trabaja en UTC y, sin este ajuste, después de las 7:00 p. m. el servidor ya vería el día siguiente.

---

## 2. Puesta en marcha

### Variables de entorno
Copia `.env.example` a `.env` dentro de `backend/` (los scripts no leen un `.env` en la raíz):

```bash
cp .env.example .env
```

Configura tus valores:
```env
PORT=3000
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/ecoruta
JWT_SECRET=tu-clave-secreta-segura
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
ADMIN_NOMBRE=Administrador EcoRuta
ADMIN_EMAIL=admin@ecoruta.co
ADMIN_PASSWORD=Admin123456*
```

### Comandos disponibles

```bash
# Iniciar en modo desarrollo con recarga automática
npm run dev

# Iniciar en producción
npm start

# Ejecutar pruebas automatizadas (56 en total: 54 activas y 2 de integración omitidas sin base)
npm test

# Crear o actualizar el administrador inicial (RF-05)
npm run crear-admin

# Ejecutar migraciones de la base de datos (PostgreSQL)
npm run migrate up
```

---

## 3. Endpoints de la API

### Autenticación (`/api/auth`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Inicia sesión con correo/email y contraseña/password (Zod). Devuelve token JWT. |
| `POST` | `/api/auth/logout` | Público | Cierra la sesión (el cliente descarta el token). |
| `GET` | `/api/auth/perfil` | Autenticado (`Bearer`) | Devuelve la información del usuario autenticado en el token. |

### Panel Administrativo (`/api/admin`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/verificar` | Admin (`Bearer` + `admin`) | Valida que el token pertenezca a un usuario con rol `admin`. |
| `GET` | `/api/admin/dashboard-resumen` | Admin (`Bearer` + `admin`) | Indicadores del dashboard. Todos los valores son `number`. |
| `GET` | `/api/admin/servicios-hoy` | Admin (`Bearer` + `admin`) | Servicios programados hoy. Filtros opcionales: `zona`, `comuna_id`, `estado`. |

Sin token responden **401**; con un usuario que no es administrador, **403**. Los errores tienen la forma `{ error, mensaje }` y `mensaje` está en español.

### `GET /api/admin/dashboard-resumen`

```json
{
  "mensaje": "Datos del resumen del panel obtenidos correctamente.",
  "datos": {
    "total_vehiculos": 5,
    "vehiculos_operativos": 4,
    "vehiculos_disponibles": 2,
    "vehiculos_en_ruta": 1,
    "vehiculos_mantenimiento": 1,
    "total_conductores": 4,
    "conductores_activos": 3,
    "conductores_habilitados": 3,
    "conductores_por_vencer": 0,
    "total_rutas": 4,
    "rutas_activas": 3,
    "rutas_suspendidas": 1,
    "rutas_programadas": 6,
    "servicios_hoy": 4,
    "servicios_conflicto": 2,
    "total_localidades": 2,
    "total_comunas": 12,
    "total_barrios": 104
  }
}
```

| Campo | Cómo se calcula |
|---|---|
| `total_vehiculos` | Vehículos activos. |
| `vehiculos_operativos` | Activos y que no están `fuera_de_servicio` (incluye los que están en mantenimiento). |
| `vehiculos_disponibles` / `vehiculos_mantenimiento` | Activos con ese estado. |
| `vehiculos_en_ruta` | Vehículos con una programación en curso ahora (según turno y hora de Bogotá). |
| `total_conductores` / `conductores_activos` | Todos los conductores / los de estado `activo`. |
| `conductores_habilitados` | Activos con licencia vigente (vence hoy o después). |
| `conductores_por_vencer` | Activos cuya licencia vence en los próximos 30 días (incluye hoy). |
| `total_rutas`, `rutas_activas`, `rutas_suspendidas` | Conteo de rutas por estado. |
| `rutas_programadas` | Programaciones en estado `programada` (nombre heredado de la vista original). |
| `servicios_hoy` | Servicios programados para hoy (`fn_servicios_del_dia`). |
| `servicios_conflicto` | Servicios de hoy con estado `conflicto`. |
| `total_localidades`, `total_comunas`, `total_barrios` | Para el subtítulo "2 Localidades · 12 Comunas · 104 Barrios" (barrios activos). |

Ningún campo es `null` ni texto: si algo no se puede calcular, vale `0`. Si faltan las migraciones, responde **503** con `{ error: "Base de datos desactualizada", mensaje }`.

### `GET /api/admin/servicios-hoy`

Filtros opcionales por query (un valor vacío se ignora):

| Parámetro | Valores | Ejemplo |
|---|---|---|
| `zona` | `Isla` o `Continente` (sin distinguir mayúsculas) | `?zona=Isla` |
| `comuna_id` | Entero positivo: `id` de la comuna principal del servicio | `?comuna_id=3` |
| `estado` | `en_curso`, `programada` o `conflicto` | `?estado=conflicto` |

```json
{
  "datos": [
    {
      "id": 5,
      "ruta_id": 1,
      "ruta": "Ruta 1 · Centro",
      "sector": "Comuna 3 · Isla",
      "zona": "Isla",
      "comuna": "Comuna 3",
      "vehiculo": "TUR101",
      "conductor": "Carlos Andrés Mosquera Rivas",
      "hora_inicio": "06:00",
      "hora_fin": "14:00",
      "estado": "en_curso"
    }
  ]
}
```

- Ordenado por `hora_inicio` y luego por nombre de ruta. Sin servicios devuelve `{ "datos": [] }`.
- `hora_inicio` y `hora_fin` son texto `HH:MM`.
- **Sector de la ruta:** una ruta puede pasar por varias comunas. Se toma como principal la comuna con más barrios de la ruta (si empatan, la de menor número). `zona` es la de esa comuna. Una ruta sin barrios aparece con `sector: "Sin sector asignado"` y `zona`, `comuna` en `null`; no sale al filtrar por zona o comuna.
- **Estado:** `conflicto` si otro servicio de hoy usa el mismo vehículo o conductor en el mismo horario; `en_curso` si la hora actual (Bogotá) está dentro del turno; `programada` en los demás casos. Si un servicio está en curso y además tiene conflicto, se muestra como `conflicto`.
- **Turnos nocturnos:** un servicio nocturno aparece en la lista del día en que empieza. A las 3:00 a. m. de ese turno cuenta en `vehiculos_en_ruta`, pero no sale en la tabla del día siguiente.
- Un filtro inválido responde **400** con `{ error: "Datos inválidos", mensaje, detalles }`.

---

## 4. Pruebas

### Automáticas (Vitest + Supertest)

```bash
cd backend
npm install
npm test            # 54 aprobadas sin base; no necesita base de datos
npm run test:watch  # modo interactivo
```

La capa `pg` se simula con `vi.mock`. Si se define `TEST_DATABASE_URL` con un PostgreSQL alcanzable
(rama `test` de Neon o base local), se ejecutan además 2 pruebas de integración reales que crean y
eliminan un usuario temporal: la suite completa queda en **56/56**. Registro de casos, resultados y
evidencia: [`../docs/pruebas.md`](../docs/pruebas.md).

Pendiente por dependencia del backend: pruebas de vehículos y conductores (RNF-16), porque los
endpoints aún no existen en `Dev`. Las restricciones `UNIQUE` de la base sí están verificadas.

### Manuales

Puedes importar la colección preconfigurada para Thunder Client en VS Code o Postman desde el archivo:
`backend/thunder-collection_ecoruta_auth.json`. Incluye el login, los endpoints del dashboard (ECO-12) y los casos 401 y 400. Pega el token del login en el encabezado `Authorization` de cada petición.
