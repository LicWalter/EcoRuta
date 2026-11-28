import { test } from 'vitest';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { loginSchema } from '../src/schemas/authSchemas.js';
import { autenticar } from '../src/middlewares/autenticar.js';
import { soloAdmin } from '../src/middlewares/soloAdmin.js';

// Configurar variable de entorno para la prueba
process.env.JWT_SECRET = 'clave-secreta-de-prueba-ecoruta';

test('1. Validación Zod: acepta campos correo y contrasena válidos', () => {
  const data = { correo: 'admin@ecoruta.co', contrasena: '12345678' };
  const resultado = loginSchema.safeParse(data);
  assert.equal(resultado.success, true);
});

test('2. Validación Zod: acepta campos alternativos email y password válidos', () => {
  const data = { email: 'admin@ecoruta.co', password: 'password123' };
  const resultado = loginSchema.safeParse(data);
  assert.equal(resultado.success, true);
});

test('3. Validación Zod: rechaza formato de correo inválido', () => {
  const data = { correo: 'correo-no-valido', contrasena: '12345678' };
  const resultado = loginSchema.safeParse(data);
  assert.equal(resultado.success, false);
});

test('4. Validación Zod: rechaza cuando no se envía contraseña', () => {
  const data = { correo: 'admin@ecoruta.co' };
  const resultado = loginSchema.safeParse(data);
  assert.equal(resultado.success, false);
});

test('5. Hashing RNF-01: bcrypt genera un hash seguro y verifica correctamente', async () => {
  const password = 'PasswordSeguro123!';
  const hash = await bcrypt.hash(password, 10);
  assert.notEqual(hash, password);
  assert.equal(await bcrypt.compare(password, hash), true);
  assert.equal(await bcrypt.compare('PasswordErroneo', hash), false);
});

test('6. Middleware autenticar: rechaza peticiones sin encabezado Authorization', () => {
  const req = { headers: {} };
  let statusEnviado = null;
  let jsonEnviado = null;
  const res = {
    status(code) {
      statusEnviado = code;
      return this;
    },
    json(body) {
      jsonEnviado = body;
      return this;
    },
  };
  let nextLlamado = false;
  const next = () => {
    nextLlamado = true;
  };

  autenticar(req, res, next);
  assert.equal(statusEnviado, 401);
  assert.equal(nextLlamado, false);
  assert.match(jsonEnviado.mensaje, /debes incluir un token Bearer/i);
});

test('7. Middleware autenticar (RNF-02): rechaza tokens expirados con mensaje comprensible', () => {
  // Token firmado que expira inmediatamente
  const tokenExpirado = jwt.sign(
    { id: 1, correo: 'admin@ecoruta.co', rol: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '0s' }
  );

  const req = {
    headers: { authorization: `Bearer ${tokenExpirado}` },
  };
  let statusEnviado = null;
  let jsonEnviado = null;
  const res = {
    status(code) {
      statusEnviado = code;
      return this;
    },
    json(body) {
      jsonEnviado = body;
      return this;
    },
  };
  let nextLlamado = false;
  const next = () => {
    nextLlamado = true;
  };

  autenticar(req, res, next);
  assert.equal(statusEnviado, 401);
  assert.equal(nextLlamado, false);
  assert.equal(jsonEnviado.error, 'Sesión expirada');
});

test('8. Middleware autenticar: permite acceso y extrae payload con token válido', () => {
  const tokenValido = jwt.sign(
    { id: 1, nombre: 'Admin EcoRuta', correo: 'admin@ecoruta.co', rol: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = {
    headers: { authorization: `Bearer ${tokenValido}` },
  };
  let nextLlamado = false;
  const res = {};
  const next = () => {
    nextLlamado = true;
  };

  autenticar(req, res, next);
  assert.equal(nextLlamado, true);
  assert.equal(req.usuario.id, 1);
  assert.equal(req.usuario.rol, 'admin');
});

test('9. Middleware soloAdmin (RF-04): rechaza a usuarios sin rol admin', () => {
  const req = { usuario: { id: 2, rol: 'ciudadano' } };
  let statusEnviado = null;
  let jsonEnviado = null;
  const res = {
    status(code) {
      statusEnviado = code;
      return this;
    },
    json(body) {
      jsonEnviado = body;
      return this;
    },
  };
  let nextLlamado = false;
  const next = () => {
    nextLlamado = true;
  };

  soloAdmin(req, res, next);
  assert.equal(statusEnviado, 403);
  assert.equal(nextLlamado, false);
  assert.match(jsonEnviado.mensaje, /permisos de administrador/i);
});

test('10. Middleware soloAdmin (RF-04): autoriza a usuarios con rol admin', () => {
  const req = { usuario: { id: 1, rol: 'admin' } };
  let nextLlamado = false;
  const res = {};
  const next = () => {
    nextLlamado = true;
  };

  soloAdmin(req, res, next);
  assert.equal(nextLlamado, true);
});
