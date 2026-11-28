import { apiFetch } from './client.js';

/*
 * Contrato con el backend (backend/src/routes):
 *   POST /api/auth/login            body: { correo, contrasena }
 *     200 -> { mensaje, token, usuario: { id, nombre, correo, rol } }
 *     401 -> { error, mensaje }
 *   GET  /api/admin/dashboard-resumen   (Authorization: Bearer <token>, solo rol admin)
 *     200 -> { mensaje, datos: { ...columnas de fn_dashboard_resumen() } }
 *   GET  /api/admin/servicios-hoy       (mismo Bearer; solo rol admin; filtros opcionales: zona, comuna_id, estado)
 *     200 -> { datos: [ { id, ruta_id, ruta, sector, zona, comuna, vehiculo, conductor,
 *                         hora_inicio, hora_fin, estado: 'en_curso'|'programada'|'conflicto' } ] }
 */

export const ENDPOINTS = {
  LOGIN: '/api/auth/login',
  RESUMEN: '/api/admin/dashboard-resumen',
  SERVICIOS_HOY: '/api/admin/servicios-hoy',
};

export function login(correo, contrasena) {
  return apiFetch(ENDPOINTS.LOGIN, { method: 'POST', body: { correo, contrasena }, auth: false });
}

export function getResumen() {
  return apiFetch(ENDPOINTS.RESUMEN);
}

export function getServiciosHoy() {
  return apiFetch(ENDPOINTS.SERVICIOS_HOY);
}
