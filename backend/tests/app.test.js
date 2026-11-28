import { test } from 'vitest';
import assert from 'node:assert/strict';
import app from '../src/app.js';

// Levanta la aplicación en un puerto libre y devuelve la URL base
const iniciar = () =>
  new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });

const preflight = (url, origin) =>
  fetch(`${url}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
  });

test('CORS (producción): permite el origen de FRONTEND_URL', async () => {
  process.env.NODE_ENV = 'production';
  process.env.FRONTEND_URL = 'https://ecoruta.netlify.app';
  const { server, url } = await iniciar();
  try {
    const res = await preflight(url, 'https://ecoruta.netlify.app');
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://ecoruta.netlify.app');
  } finally {
    server.close();
  }
});

test('CORS (producción): bloquea un origen ajeno y localhost', async () => {
  process.env.NODE_ENV = 'production';
  process.env.FRONTEND_URL = 'https://ecoruta.netlify.app';
  const { server, url } = await iniciar();
  try {
    const ajeno = await preflight(url, 'https://sitio-ajeno.com');
    assert.equal(ajeno.headers.get('access-control-allow-origin'), null);
    const local = await preflight(url, 'http://localhost:5173');
    assert.equal(local.headers.get('access-control-allow-origin'), null);
  } finally {
    server.close();
  }
});

test('CORS (desarrollo): permite http://localhost con cualquier puerto', async () => {
  process.env.NODE_ENV = 'development';
  process.env.FRONTEND_URL = 'https://ecoruta.netlify.app';
  const { server, url } = await iniciar();
  try {
    const res = await preflight(url, 'http://localhost:5173');
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  } finally {
    server.close();
  }
});

test('Errores: un JSON mal formado responde 400 con mensaje en español', async () => {
  const { server, url } = await iniciar();
  try {
    const res = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{malo',
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.error, 'JSON inválido');
    assert.match(body.mensaje, /no es un JSON válido/);
  } finally {
    server.close();
  }
});
