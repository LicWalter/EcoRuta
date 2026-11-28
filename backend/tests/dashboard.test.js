import { test } from 'vitest';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import { CAMPOS_RESUMEN } from '../src/controllers/dashboardController.js';

process.env.JWT_SECRET = 'clave-de-prueba-dashboard';

const tokenDe = (rol) => jwt.sign({ id: 1, nombre: 'Prueba', correo: 'prueba@ecoruta.co', rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
const tokenAdmin = () => tokenDe('admin');

// Levanta la aplicación en un puerto libre
const iniciar = () =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });

// Sustituye pool.query durante la prueba y registra las consultas recibidas
const conBaseSimulada = async (respuesta, prueba) => {
  const original = pool.query;
  const llamadas = [];
  pool.query = async (texto, parametros) => {
    llamadas.push({ texto, parametros });
    return typeof respuesta === 'function' ? respuesta(texto, parametros) : respuesta;
  };
  const { server, url } = await iniciar();
  try {
    await prueba({ url, llamadas });
  } finally {
    server.close();
    pool.query = original;
  }
};

const pedir = (url, ruta, token) =>
  fetch(`${url}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

// Fila tal como la entrega Postgres con bigint: todo en texto
const filaEnTexto = Object.fromEntries(CAMPOS_RESUMEN.map((campo, i) => [campo, String(i + 1)]));

const servicio = {
  id: 2,
  ruta_id: 1,
  ruta: 'Ruta 1 · Centro',
  sector: 'Comuna 3 · Isla',
  zona: 'Isla',
  comuna: 'Comuna 3',
  vehiculo: 'TUR101',
  conductor: 'Carlos Andrés Mosquera Rivas',
  hora_inicio: '06:00',
  hora_fin: '14:00',
  estado: 'en_curso',
};

// ---------- Seguridad (ambos endpoints) ----------

for (const ruta of ['/api/admin/dashboard-resumen', '/api/admin/servicios-hoy']) {
  test(`${ruta}: responde 401 en español sin token y no consulta la base`, async () => {
    await conBaseSimulada({ rows: [] }, async ({ url, llamadas }) => {
      const res = await pedir(url, ruta);
      const cuerpo = await res.json();
      assert.equal(res.status, 401);
      assert.ok(cuerpo.error);
      assert.match(cuerpo.mensaje, /token/i);
      assert.equal(llamadas.length, 0);
    });
  });

  test(`${ruta}: responde 401 con un token inválido`, async () => {
    await conBaseSimulada({ rows: [] }, async ({ url, llamadas }) => {
      const res = await pedir(url, ruta, 'token.falso.123');
      assert.equal(res.status, 401);
      assert.equal(llamadas.length, 0);
    });
  });

  test(`${ruta}: responde 403 si el usuario no es administrador`, async () => {
    await conBaseSimulada({ rows: [] }, async ({ url, llamadas }) => {
      const res = await pedir(url, ruta, tokenDe('ciudadano'));
      const cuerpo = await res.json();
      assert.equal(res.status, 403);
      assert.ok(cuerpo.error);
      assert.match(cuerpo.mensaje, /administrador/i);
      assert.equal(llamadas.length, 0);
    });
  });
}

// ---------- GET /api/admin/dashboard-resumen ----------

test('dashboard-resumen: convierte los conteos en texto a número y devuelve todos los campos', async () => {
  await conBaseSimulada({ rows: [filaEnTexto] }, async ({ url, llamadas }) => {
    const res = await pedir(url, '/api/admin/dashboard-resumen', tokenAdmin());
    const cuerpo = await res.json();
    assert.equal(res.status, 200);
    assert.match(cuerpo.mensaje, /resumen/i);
    assert.deepEqual(Object.keys(cuerpo.datos), CAMPOS_RESUMEN);
    CAMPOS_RESUMEN.forEach((campo, i) => {
      assert.equal(typeof cuerpo.datos[campo], 'number', `${campo} debe ser number`);
      assert.equal(cuerpo.datos[campo], i + 1);
    });
    assert.match(llamadas[0].texto, /fn_dashboard_resumen/);
  });
});

test('dashboard-resumen: incluye los campos que ya existían y los nuevos', () => {
  for (const campo of [
    'total_vehiculos', 'vehiculos_disponibles', 'vehiculos_mantenimiento', 'total_conductores', 'conductores_activos',
    'total_rutas', 'rutas_activas', 'rutas_suspendidas', 'rutas_programadas',
    'vehiculos_operativos', 'vehiculos_en_ruta', 'conductores_habilitados', 'conductores_por_vencer',
    'servicios_hoy', 'servicios_conflicto', 'total_localidades', 'total_comunas', 'total_barrios',
  ]) {
    assert.ok(CAMPOS_RESUMEN.includes(campo), `falta ${campo}`);
  }
});

test('dashboard-resumen: si la base no devuelve filas o trae null, responde 0 y nunca null ni texto', async () => {
  const conNulos = { ...filaEnTexto, vehiculos_en_ruta: null, servicios_hoy: undefined, total_barrios: 'abc' };
  for (const respuesta of [{ rows: [] }, { rows: [conNulos] }]) {
    await conBaseSimulada(respuesta, async ({ url }) => {
      const res = await pedir(url, '/api/admin/dashboard-resumen', tokenAdmin());
      const { datos } = await res.json();
      assert.equal(res.status, 200);
      for (const campo of CAMPOS_RESUMEN) assert.equal(typeof datos[campo], 'number', `${campo} debe ser number`);
      if (respuesta.rows.length === 0) assert.ok(CAMPOS_RESUMEN.every((campo) => datos[campo] === 0));
      else {
        assert.equal(datos.vehiculos_en_ruta, 0);
        assert.equal(datos.servicios_hoy, 0);
        assert.equal(datos.total_barrios, 0);
      }
    });
  }
});

test('dashboard-resumen: si faltan las migraciones responde 503 con un mensaje claro', async () => {
  const falla = () => {
    const error = new Error('function fn_dashboard_resumen() does not exist');
    error.code = '42883';
    throw error;
  };
  await conBaseSimulada(falla, async ({ url }) => {
    const res = await pedir(url, '/api/admin/dashboard-resumen', tokenAdmin());
    const cuerpo = await res.json();
    assert.equal(res.status, 503);
    assert.equal(cuerpo.error, 'Base de datos desactualizada');
    assert.match(cuerpo.mensaje, /migraciones/);
  });
});

// ---------- GET /api/admin/servicios-hoy ----------

test('servicios-hoy: devuelve { datos: [...] } con los campos acordados', async () => {
  await conBaseSimulada({ rows: [servicio] }, async ({ url, llamadas }) => {
    const res = await pedir(url, '/api/admin/servicios-hoy', tokenAdmin());
    const cuerpo = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(cuerpo), ['datos']);
    assert.deepEqual(cuerpo.datos, [servicio]);
    assert.match(llamadas[0].texto, /fn_servicios_hoy/);
    assert.match(llamadas[0].texto, /ORDER BY hora_inicio/);
    assert.doesNotMatch(llamadas[0].texto, /WHERE/);
    assert.deepEqual(llamadas[0].parametros, []);
  });
});

test('servicios-hoy: sin servicios devuelve una lista vacía', async () => {
  await conBaseSimulada({ rows: [] }, async ({ url }) => {
    const res = await pedir(url, '/api/admin/servicios-hoy', tokenAdmin());
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { datos: [] });
  });
});

test('servicios-hoy: aplica los filtros zona, comuna_id y estado con parámetros (sin concatenar texto)', async () => {
  await conBaseSimulada({ rows: [servicio] }, async ({ url, llamadas }) => {
    const res = await pedir(url, '/api/admin/servicios-hoy?zona=ISLA&comuna_id=3&estado=conflicto', tokenAdmin());
    assert.equal(res.status, 200);
    assert.match(llamadas[0].texto, /WHERE LOWER\(zona\) = \$1 AND comuna_id = \$2 AND estado = \$3/);
    assert.deepEqual(llamadas[0].parametros, ['isla', 3, 'conflicto']);
  });
});

test('servicios-hoy: un filtro vacío (?zona=) se ignora', async () => {
  await conBaseSimulada({ rows: [] }, async ({ url, llamadas }) => {
    const res = await pedir(url, '/api/admin/servicios-hoy?zona=&comuna_id=&estado=', tokenAdmin());
    assert.equal(res.status, 200);
    assert.doesNotMatch(llamadas[0].texto, /WHERE/);
    assert.deepEqual(llamadas[0].parametros, []);
  });
});

for (const [consulta, mensaje] of [
  ['zona=Norte', /Isla o Continente/],
  ['estado=terminado', /en_curso, programada o conflicto/],
  ['comuna_id=abc', /número entero positivo/],
  ['comuna_id=0', /número entero positivo/],
  ['comuna_id=2.5', /número entero positivo/],
  ["zona=isla'%20OR%201=1", /Isla o Continente/],
]) {
  test(`servicios-hoy: ?${consulta} responde 400 con mensaje en español y no consulta la base`, async () => {
    await conBaseSimulada({ rows: [] }, async ({ url, llamadas }) => {
      const res = await pedir(url, `/api/admin/servicios-hoy?${consulta}`, tokenAdmin());
      const cuerpo = await res.json();
      assert.equal(res.status, 400);
      assert.equal(cuerpo.error, 'Datos inválidos');
      assert.match(cuerpo.mensaje, mensaje);
      assert.ok(Array.isArray(cuerpo.detalles));
      assert.equal(llamadas.length, 0);
    });
  });
}

test('servicios-hoy: si faltan las migraciones responde 503', async () => {
  const falla = () => {
    const error = new Error('relation does not exist');
    error.code = '42P01';
    throw error;
  };
  await conBaseSimulada(falla, async ({ url }) => {
    const res = await pedir(url, '/api/admin/servicios-hoy', tokenAdmin());
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, 'Base de datos desactualizada');
  });
});
