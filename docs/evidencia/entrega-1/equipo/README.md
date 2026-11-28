# Evidencia de apoyo — aportada por el equipo

Estas capturas **no** las tomó el Integrante 7 ni corresponden a la URL pública. Las envió el
integrante que trabajó **ECO-12 (endpoints del dashboard)** el **2026-11-23**, desde su equipo y
contra la rama **`dev` de Neon** (proyecto `ecoruta`).

Se guardan aquí como respaldo porque confirman que los endpoints y la base funcionan fuera del
entorno local. No sustituyen las capturas de la URL pública que pide la entrega 3.

## Qué muestra cada archivo

| Archivo | Contenido |
|---|---|
| `eco12-login-y-resumen-200.jpg` | Script `evidencia-eco-12.js`: login exitoso y primeras columnas de `GET /api/admin/dashboard-resumen` (HTTP 200) |
| `eco12-dashboard-18-indicadores.jpg` | Los 18 indicadores del resumen, `GET /api/admin/servicios-hoy` vacío y filtro `?zona=Isla` (HTTP 200) |
| `eco12-validacion-400-y-401.jpg` | Filtro inválido `?zona=Norte` → 400 con `detalles`; panel sin token → 401; cierre de la demo |
| `neon-usuarios-consulta.jpg` | `SELECT` sobre `usuarios`: `admin@ecoruta.co` y `juan.perez@ecoruta.co`, rol `admin`, hash bcrypt |
| `neon-usuarios-estructura.jpg` | Estructura de `usuarios`: `CHECK rol='admin'`, índice único `LOWER(correo)` |
| `neon-conteo-tablas.jpg` | Conteo por tabla: 104 barrios, 12 comunas, 4 conductores, 2 localidades, 2 programaciones, 5 puntos de recolección, 4 rutas, 3 turnos, usuarios y vehículos |
| `neon-conteo-tablas-detalle.jpg` | El mismo conteo ampliado: usuarios 2, vehículos 5 |
| `neon-turnos-datos.jpg` | Tabla `turnos` con Mañana (06:00–14:00), Tarde (14:00–22:00) y Noche (22:00–06:00) |
| `neon-migraciones-1-8.jpg` | `pgmigrations` del 1 al 8 |
| `neon-migraciones-8-15.jpg` | `pgmigrations` del 8 al 15 |
| `neon-barrios-datos.jpg` | Tabla `barrios` con la geografía real de Buenaventura |
| `neon-vista-resumen-dashboard.jpg` | `SELECT * FROM v_resumen_dashboard` |

## Qué respaldan

- Login con JWT contra una base real.
- Los 18 indicadores del dashboard y sus valores esperados.
- Validación de filtros (400) y bloqueo sin token (401).
- Que las 15 migraciones y los datos del seed están aplicados en Neon `dev`.
- Que no se versionaron credenciales: no hay `.env` en ninguna rama.

## Qué **no** respaldan

- Interfaz del panel, mapa, vehículos, conductores, rutas, programación ni simulación.
- Despliegue en una URL pública.
- CRUD de barrios (ECO-16), que todavía no existe.
