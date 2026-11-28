import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Simula la capa de datos: estas pruebas de API no necesitan PostgreSQL.
vi.mock('../src/config/db.js', () => ({
  query: vi.fn(),
  default: { query: vi.fn() },
}));

import app from '../src/app.js';
import { query } from '../src/config/db.js';

process.env.JWT_SECRET = 'clave-de-prueba-api-auth';
process.env.JWT_EXPIRES_IN = '8h';

const PASSWORD = 'ClaveCorrecta123*';
const USUARIO = {
  id: 7,
  nombre: 'Admin de Prueba',
  correo: 'admin@ecoruta.co',
  rol: 'admin',
  activo: true,
};

let hashPassword;

beforeAll(async () => {
  // 10 rondas: suficiente para la prueba y más rápido que las 12 de producción.
  hashPassword = await bcrypt.hash(PASSWORD, 10);
});

beforeEach(() => {
  query.mockReset();
});

const responderConUsuario = (extra = {}) =>
  query.mockResolvedValue({
    rows: [{ ...USUARIO, contrasena_hash: hashPassword, ...extra }],
  });

const login = (body) => request(app).post('/api/auth/login').send(body);

describe('POST /api/auth/login (RF-01, RF-02, RNF-01, RNF-02)', () => {
  it('responde 200 con token JWT válido y los datos del administrador', async () => {
    responderConUsuario();

    const res = await login({ correo: USUARIO.correo, contrasena: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/inicio de sesión exitoso/i);
    expect(res.body.usuario).toMatchObject({
      id: USUARIO.id,
      nombre: USUARIO.nombre,
      correo: USUARIO.correo,
      rol: 'admin',
    });
    expect(typeof res.body.token).toBe('string');

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ id: USUARIO.id, correo: USUARIO.correo, rol: 'admin' });
    expect(payload).not.toHaveProperty('contrasena_hash');
  });

  it('acepta los alias email y password', async () => {
    responderConUsuario();

    const res = await login({ email: 'ADMIN@ecoruta.co', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.usuario.correo).toBe(USUARIO.correo);
    // El correo se normaliza a minúsculas antes de consultar.
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/LOWER\(correo\)/), ['admin@ecoruta.co']);
  });

  it('responde 401 con mensaje comprensible si la contraseña es incorrecta', async () => {
    responderConUsuario();

    const res = await login({ correo: USUARIO.correo, contrasena: 'ClaveEquivocada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales incorrectas');
    expect(res.body.mensaje).toMatch(/correo o contraseña incorrectos/i);
    expect(res.body).not.toHaveProperty('token');
  });

  it('responde 401 con el mismo mensaje cuando el correo no existe (no revela usuarios)', async () => {
    query.mockResolvedValue({ rows: [] });

    const res = await login({ correo: 'noexiste@ecoruta.co', contrasena: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales incorrectas');
    expect(res.body.mensaje).toMatch(/correo o contraseña incorrectos/i);
  });

  it('responde 400 con detalles si el correo no tiene formato válido', async () => {
    const res = await login({ correo: 'correo-invalido', contrasena: PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
    expect(res.body.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'correo' })])
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('responde 400 si falta la contraseña', async () => {
    const res = await login({ correo: USUARIO.correo });

    expect(res.status).toBe(400);
    expect(res.body.detalles).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'contrasena' })])
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('responde 403 si la cuenta está inactiva y la contraseña es correcta', async () => {
    responderConUsuario({ activo: false });

    const res = await login({ correo: USUARIO.correo, contrasena: PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Cuenta inactiva');
    expect(res.body.mensaje).toMatch(/desactivada/i);
  });

  it('responde 500 controlado si falta JWT_SECRET', async () => {
    responderConUsuario();
    const secretoOriginal = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      const res = await login({ correo: USUARIO.correo, contrasena: PASSWORD });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error de configuración');
    } finally {
      process.env.JWT_SECRET = secretoOriginal;
    }
  });
});

describe('Rutas del panel sin autorización (RF-04)', () => {
  it('GET /api/admin/verificar responde 401 sin token', async () => {
    const res = await request(app).get('/api/admin/verificar');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No autorizado');
    expect(res.body.mensaje).toMatch(/token Bearer/i);
  });

  it('GET /api/admin/dashboard-resumen responde 401 sin token y no consulta la base', async () => {
    const res = await request(app).get('/api/admin/dashboard-resumen');

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it('GET /api/admin/servicios-hoy responde 401 con un token inválido', async () => {
    const res = await request(app)
      .get('/api/admin/servicios-hoy')
      .set('Authorization', 'Bearer token.falso.123');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido');
    expect(query).not.toHaveBeenCalled();
  });

  it('GET /api/admin/dashboard-resumen responde 403 si el rol no es admin', async () => {
    const tokenCiudadano = jwt.sign(
      { id: 9, nombre: 'Ciudadano', correo: 'ciudadano@ecoruta.co', rol: 'ciudadano' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/admin/dashboard-resumen')
      .set('Authorization', `Bearer ${tokenCiudadano}`);

    expect(res.status).toBe(403);
    expect(res.body.mensaje).toMatch(/administrador/i);
    expect(query).not.toHaveBeenCalled();
  });
});
