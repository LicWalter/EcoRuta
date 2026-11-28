import { test } from 'vitest';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { login, logout, obtenerPerfil } from '../src/controllers/authController.js';
import pool from '../src/config/db.js';

process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.JWT_EXPIRES_IN = '8h';

// Helper para mockear res
const createMockRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

test('Controller - Login: retorna 401 si el usuario no existe (RF-02)', async () => {
  // Mockear pool.query para simular que no encuentra usuario
  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [] });

  try {
    const req = {
      body: { correo: 'noexiste@ecoruta.co', contrasena: 'Clave1234*' },
    };
    const res = createMockRes();

    await login(req, res, (err) => assert.fail(err));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Credenciales incorrectas');
    assert.match(res.body.mensaje, /correo o contraseña incorrectos/i);
  } finally {
    pool.query = originalQuery;
  }
});

test('Controller - Login: retorna 403 si el usuario está inactivo y la contraseña es correcta', async () => {
  const hash = await bcrypt.hash('Clave1234*', 10);
  const originalQuery = pool.query;
  pool.query = async () => ({
    rows: [
      {
        id: 1,
        nombre: 'Admin Inactivo',
        correo: 'inactivo@ecoruta.co',
        contrasena_hash: hash,
        rol: 'admin',
        activo: false,
      },
    ],
  });

  try {
    const req = {
      body: { correo: 'inactivo@ecoruta.co', contrasena: 'Clave1234*' },
    };
    const res = createMockRes();

    await login(req, res, (err) => assert.fail(err));

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Cuenta inactiva');
  } finally {
    pool.query = originalQuery;
  }
});

test('Controller - Login: cuenta inactiva con contraseña incorrecta responde 401, sin revelar que existe', async () => {
  const hash = await bcrypt.hash('Clave1234*', 10);
  const originalQuery = pool.query;
  pool.query = async () => ({
    rows: [
      {
        id: 1,
        nombre: 'Admin Inactivo',
        correo: 'inactivo@ecoruta.co',
        contrasena_hash: hash,
        rol: 'admin',
        activo: false,
      },
    ],
  });

  try {
    const req = {
      body: { correo: 'inactivo@ecoruta.co', contrasena: 'otra-clave' },
    };
    const res = createMockRes();

    await login(req, res, (err) => assert.fail(err));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Credenciales incorrectas');
  } finally {
    pool.query = originalQuery;
  }
});

test('Controller - Login: retorna 401 si la contraseña es incorrecta (RF-02, RNF-01)', async () => {
  const realHash = await bcrypt.hash('ClaveCorrecta123', 10);
  const originalQuery = pool.query;
  pool.query = async () => ({
    rows: [
      {
        id: 1,
        nombre: 'Admin Activo',
        correo: 'admin@ecoruta.co',
        contrasena_hash: realHash,
        rol: 'admin',
        activo: true,
      },
    ],
  });

  try {
    const req = {
      body: { correo: 'admin@ecoruta.co', contrasena: 'ClaveEquivocada' },
    };
    const res = createMockRes();

    await login(req, res, (err) => assert.fail(err));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Credenciales incorrectas');
  } finally {
    pool.query = originalQuery;
  }
});

test('Controller - Login: retorna 200 y token JWT válido con credenciales correctas (RF-01, RNF-02)', async () => {
  const password = 'ClaveCorrecta123';
  const realHash = await bcrypt.hash(password, 10);
  const originalQuery = pool.query;
  pool.query = async () => ({
    rows: [
      {
        id: 42,
        nombre: 'Victor Vera Admin',
        correo: 'admin@ecoruta.co',
        contrasena_hash: realHash,
        rol: 'admin',
        activo: true,
      },
    ],
  });

  try {
    const req = {
      body: { correo: 'admin@ecoruta.co', contrasena: password },
    };
    const res = createMockRes();

    await login(req, res, (err) => assert.fail(err));

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.mensaje, 'Inicio de sesión exitoso');
    assert.ok(res.body.token, 'Debe devolver un token JWT');
    assert.equal(res.body.usuario.id, 42);
    assert.equal(res.body.usuario.rol, 'admin');

    // Verificar que el token decodificado coincide
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(decoded.id, 42);
    assert.equal(decoded.correo, 'admin@ecoruta.co');
  } finally {
    pool.query = originalQuery;
  }
});

test('Controller - Logout: retorna 200 confirmando cierre de sesión (RF-03)', async () => {
  const req = {};
  const res = createMockRes();

  await logout(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.mensaje, /cierre de sesión exitoso/i);
});

test('Controller - Perfil: retorna el usuario asignado por el middleware autenticar', async () => {
  const req = {
    usuario: { id: 42, nombre: 'Admin', rol: 'admin', correo: 'admin@ecoruta.co' },
  };
  const res = createMockRes();

  await obtenerPerfil(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.usuario.id, 42);
});
