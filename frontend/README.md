# EcoRuta · Frontend

React + Vite + React Router. Se conecta al backend (`/backend`) con `fetch` a `VITE_API_URL`; el backend es el único que habla con la base de datos (Neon).

## Ejecutar en local
1. Backend corriendo en http://localhost:3000 (ver `backend/README.md`: `.env` con `DATABASE_URL`, `npm run migrate up`, `npm run seed`, `npm run crear-admin`, `npm run dev`).
2. Frontend:
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm run dev               # http://localhost:5173
```
Inicia sesión con el administrador creado por `npm run crear-admin` (por defecto `admin@ecoruta.co` / la clave de `ADMIN_PASSWORD` del `.env` del backend).

## Qué incluye (ECO-4 · acceso administrativo)
- `/login`: login en español; muestra el mensaje que devuelve el backend. Avisos: sesión requerida, credenciales incorrectas, sin conexión.
- Bloqueo de rutas (RF-04): `ProtectedRoute` redirige a `/login` si no hay token en `localStorage`.
- `/dashboard`: tarjetas con `GET /api/admin/dashboard-resumen` (`Authorization: Bearer <token>`).
- Cerrar sesión: borra el token y vuelve a `/login`. Un 401 del backend también cierra la sesión.
- `/vehiculos`, `/conductores`, `/barrios`, `/mapa-rutas`, `/programacion`, `/simulacion`: protegidas y en blanco (aún sin diseño aprobado).

## Estructura
```
src/api/        client.js (fetch + Bearer), endpoints.js (contrato con el backend)
src/auth/       storage (localStorage), AuthContext, ProtectedRoute
src/components/ Layout (barra lateral), Notice, Icon, nav
src/pages/publico/  HomePage, LoginPage
src/pages/admin/    DashboardPage, SeccionPage (en blanco)
src/routes/     AppRouter
```

## Pendiente
- La tabla "Servicios Programados Hoy" lee `GET /api/admin/servicios-hoy` (ruta **supuesta**, confirmar con Fernando; ver `src/api/endpoints.js`). Muestra solo servicios reales; sin ellos dice "No hay servicios programados para hoy." (con el seed solo hay desde el 1 de diciembre).
- "Simulación de Flota en Vivo" es una imagen de ejemplo (ver TODO en `DashboardPage.jsx`).
- Foto del camión del login: `src/assets/login-hero.jpg` es un recorte del diseño aprobado. Si se agrega `src/assets/login-camion.jpg` (sin textos), el panel se arma con textos reales encima.
- Botones "Nueva Programación", campana, "¿Olvidaste tu contraseña?" y controles de simulación: solo visuales.
