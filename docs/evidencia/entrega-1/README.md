# Evidencia — Entrega 1: Acceso administrativo

Proyecto **EcoRuta** (antes Tura Limpia) · Empresa 4 · Seminario de Actualización I · Universidad del Pacífico
Cierre: lunes 23 de noviembre de 2026, 11:59 p. m. · Release: [`semana-1`](https://github.com/EcoRuta-E4/EcoRuta/releases/tag/semana-1)

Este documento reúne la evidencia de la Entrega 1 y la relaciona con la lista de chequeo del profesor.
Todas las capturas son del **23/11/2026**. La interfaz se ejecutó en local (`http://localhost:5173`).

## 1. Resumen contra la lista de chequeo

| # | Requisito de la entrega | Evidencia | Estado |
|---|---|---|---|
| 1 | Repositorio público con README (integrantes, organización, tecnologías) | [README principal](../../../README.md) | Listo |
| 2 | Release `semana-1` que coincide con el código mostrado | Enlace del encabezado | Listo |
| 3 | PostgreSQL con migraciones desde cero | [Migraciones 1–8](equipo/neon-migraciones-1-8.jpg), [8–15](equipo/neon-migraciones-8-15.jpg) y [base local vacía](../../pruebas.md#42-postgresql-1712-local-lo-usado-en-esta-entrega) | Listo |
| 4 | Procedimiento para crear el administrador inicial | `npm run crear-admin` ([script](../../../backend/scripts/crear-admin.js)); [usuarios en Neon](equipo/neon-usuarios-consulta.jpg) y [estructura](equipo/neon-usuarios-estructura.jpg) | Listo |
| 5 | Datos mínimos de prueba o script de carga | `npm run seed` (`database/seeds`); [conteo por tabla](equipo/neon-conteo-tablas.jpg), [turnos](equipo/neon-turnos-datos.jpg), [barrios](equipo/neon-barrios-datos.jpg) | Listo |
| 6 | Backend que responde | [M-01 `/api/health`](../../pruebas.md#2-pruebas-manuales) y [login y resumen 200](equipo/eco12-login-y-resumen-200.jpg) | Listo |
| 7 | Login y logout con sesión o token | [Login](frontend/01-login.jpg), [dashboard con botón «Cerrar sesión»](frontend/03-dashboard-administrador.jpg), token guardado [antes](frontend/05a-token-antes-del-logout.jpg) y [después](frontend/05b-token-despues-del-logout.jpg) de cerrar sesión | Listo |
| 8 | Mensaje comprensible con credenciales incorrectas | [Pantalla de login con el error](frontend/02-login-credenciales-incorrectas.jpg) y [respuesta 401](../m-06-login-401.json) | Listo |
| 9 | Rutas protegidas | [Redirección a login con aviso](frontend/04-ruta-protegida-redirige-a-login.jpg); API: M-02 y M-03 en [pruebas.md](../../pruebas.md#2-pruebas-manuales) | Listo |
| 10 | Validación de permisos de administrador | Prueba 403 por rol distinto de admin (`backend/tests/api-auth.test.js`); [401 y 400](equipo/eco12-validacion-400-y-401.jpg); restricción `rol = 'admin'` en [usuarios](equipo/neon-usuarios-estructura.jpg) | Listo |
| 11 | Dashboard con accesos a vehículos, conductores, rutas y programación | [Dashboard](frontend/03-dashboard-administrador.jpg) con menú lateral y datos del backend; [respuesta JSON](../m-07-dashboard-200.json) | Listo |
| 12 | Evidencia en GitHub e instrucciones para verificar el acceso | Este documento y la sección 3 | Listo |

## 2. Capturas del frontend

| Archivo | Qué muestra |
|---|---|
| [`01-login.jpg`](frontend/01-login.jpg) | Pantalla «Iniciar sesión» del portal de administradores. |
| [`02-login-credenciales-incorrectas.jpg`](frontend/02-login-credenciales-incorrectas.jpg) | Con una contraseña incorrecta aparece «Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.» |
| [`03-dashboard-administrador.jpg`](frontend/03-dashboard-administrador.jpg) | Panel operativo tras iniciar sesión: menú con Dashboard, Vehículos, Conductores, Barrios y Rutas, Mapa de Rutas, Programación y Simulación; botón «Cerrar sesión»; indicadores del backend. |
| [`04-ruta-protegida-redirige-a-login.jpg`](frontend/04-ruta-protegida-redirige-a-login.jpg) | Sin sesión, al abrir una página interna la aplicación lleva a `/login` y muestra «Inicia sesión para continuar». |
| [`05a-token-antes-del-logout.jpg`](frontend/05a-token-antes-del-logout.jpg) | Con la sesión iniciada, las herramientas de desarrollo (Application → Local Storage → `http://localhost:5173`) muestran las claves `ecoruta_token`, `ecoruta_usuario` y `ecoruta_temporal`. El valor del token se tapó a propósito. |
| [`05b-token-despues-del-logout.jpg`](frontend/05b-token-despues-del-logout.jpg) | Tras cerrar sesión, el almacenamiento local queda vacío (sin `ecoruta_token`) y la aplicación está en `/login` con el aviso «Inicia sesión para continuar». |

Los indicadores del dashboard coinciden con la respuesta del backend guardada en
[`m-07-dashboard-200.json`](../m-07-dashboard-200.json): 4 vehículos operativos (2 disponibles, 0 en ruta),
3 conductores habilitados, 3 rutas activas con 1 suspendida, 0 servicios hoy, 2 localidades, 12 comunas y 104 barrios.

## 3. Cómo verificar el acceso administrativo

Requisitos de instalación y variables de entorno: ver «Cómo ejecutar el proyecto» en el [README principal](../../../README.md).
Con el backend en `http://localhost:3000` y el frontend en `http://localhost:5173`:

1. Abrir `http://localhost:5173/login`. Debe verse el portal de administradores.
2. Escribir el correo del administrador con una contraseña incorrecta. Debe aparecer el mensaje de credenciales incorrectas y no se crea sesión.
3. Escribir las credenciales correctas. Debe abrirse `/dashboard` con el menú lateral y los indicadores.
4. Recorrer el menú: Vehículos, Conductores, Barrios y Rutas, Mapa de Rutas, Programación y Simulación. En esta entrega solo el dashboard tiene contenido; las demás secciones se construyen en las entregas siguientes.
5. Pulsar «Cerrar sesión». La aplicación borra el token del navegador y vuelve a `/login`. Para comprobarlo, abrir `F12` → **Application** → **Local Storage** → `http://localhost:5173`: antes del logout aparece `ecoruta_token` y después ya no.
6. Sin sesión, escribir en la barra de direcciones `http://localhost:5173/dashboard`. La aplicación redirige a `/login` y muestra el aviso «Inicia sesión para continuar».

Las credenciales de demostración se envían por Teams el día de cierre.

## 4. Pruebas automáticas y manuales

- Suite con Vitest y Supertest: 56 pruebas (54 sin base de datos y 2 de integración que se activan con `TEST_DATABASE_URL`). Registro completo en [`docs/pruebas.md`](../../pruebas.md).
- Respuestas guardadas del backend en [`docs/evidencia/`](..): login 200 ([`m-05`](../m-05-login-200.json)), login 401 ([`m-06`](../m-06-login-401.json)), dashboard 200 ([`m-07`](../m-07-dashboard-200.json)) y servicios de hoy ([`m-08`](../m-08-servicios-hoy-200.json)).
- Comandos: `cd backend && npm install && npm test`.

## 5. Capturas de apoyo de Neon y del backend

La carpeta [`equipo/`](equipo/README.md) contiene 12 capturas del SQL Editor de Neon (rama `dev`) y de la demostración
de los endpoints. Su detalle está en [`equipo/README.md`](equipo/README.md).

## 6. Aportes verificables (Entrega 1)

| Pull request | Aporte | Rama |
|---|---|---|
| #1 | Base del frontend con React, Vite y React Router (ECO-34) | `feat/frontend-base` |
| #2 | Migraciones, datos de prueba y scripts de la base de datos (ECO-2, ECO-33) | `feature/ECO-2-migraciones-base-de-datos` |
| #3 | Autenticación del backend: login, CORS y manejo de errores (ECO-3) | `feature/ECO-3-autenticacion-backend` |
| #5 | Localidades, comunas y los 104 barrios oficiales (ECO-2) | — |
| #6 | Perímetro urbano de Buenaventura en GeoJSON (ECO-18) | `feature/ECO-18-perimetro-urbano` |
| #7 | Guía de contribución y plantilla de pull request (ECO-36) | `docs/ECO-36-contributing-dev` |
| #8 | Endpoints del dashboard y colección Thunder (ECO-12) | `feature/ECO-12-endpoints-dashboard` |
| #9 | Login, bloqueo de rutas y dashboard del panel (ECO-4) | `feature/ECO-4-login-dashboard` |
| #10 | Suite de pruebas y registro de evidencia | `test/pruebas-entrega-1` |
| #11 | Ajustes de estilo del menú lateral y actualización de logos (ECO-4) | `feature/ECO-4-ajustes-dashboard` |
| #12 | Evidencias de la entrega 1 y README con instrucciones de ejecución | `docs/ECO-evidencias-entrega-1` |

El detalle de quién escribió cada cambio está en la pestaña *Contributors* del repositorio y en el historial de cada pull request.

## 7. Alcance de esta entrega

Esta evidencia no incluye vehículos, conductores, rutas con mapa ni programación: son de las entregas 2, 3 y 4.
Las pruebas de la API de vehículos y conductores quedan pendientes hasta que existan los endpoints; las restricciones
`UNIQUE` de la base de datos sí están verificadas (ver [`docs/pruebas.md`](../../pruebas.md), sección 3).
