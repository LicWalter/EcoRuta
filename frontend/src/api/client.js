import { getToken } from '../auth/storage.js';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Error devuelto por el backend (4xx / 5xx). `message` es el texto que envió el backend. */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** No se pudo llegar al servidor (caído, sin red, CORS). */
export class NetworkError extends Error {
  constructor() {
    super('No pudimos conectar con el servidor.');
    this.name = 'NetworkError';
  }
}

/**
 * fetch al backend con Authorization: Bearer <token> cuando hay sesión.
 * Devuelve el JSON de la respuesta.
 */
export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError();
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Se muestra el mensaje que devuelve el backend (campos habituales: mensaje, message, error).
    const msg = data?.mensaje || data?.message || data?.error || null;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}
