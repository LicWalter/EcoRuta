import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';

// Solo corre si se define TEST_DATABASE_URL (rama test de Neon).
// Sin esa variable, el archivo se marca como omitido y la suite sigue sin base de datos.
const cadena = process.env.TEST_DATABASE_URL;

describe.skipIf(!cadena)('Integración con PostgreSQL real (TEST_DATABASE_URL)', () => {
  let app;
  let pool;
  let usuarioId;

  const correo = `calidad.${Date.now()}@ecoruta.co`;
  const password = 'ClaveIntegracion123*';

  beforeAll(async () => {
    // db.js lee DATABASE_URL al importarse, por eso se define antes del import dinámico.
    process.env.DATABASE_URL = cadena;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'clave-de-integracion-calidad';

    ({ default: app } = await import('../src/app.js'));
    ({ default: pool } = await import('../src/config/db.js'));

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, activo)
       VALUES ($1, $2, $3, 'admin', TRUE)
       RETURNING id`,
      ['Usuario de integración', correo, hash]
    );
    usuarioId = rows[0].id;
  }, 30000);

  afterAll(async () => {
    if (pool && usuarioId) {
      await pool.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
    }
    if (pool) await pool.end();
  });

  it('inicia sesión con un usuario real y devuelve un JWT utilizable', async () => {
    const res = await request(app).post('/api/auth/login').send({ correo, contrasena: password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    const perfil = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(perfil.status).toBe(200);
    expect(perfil.body.usuario.correo).toBe(correo);
  });

  it('rechaza una contraseña incorrecta contra la base real', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'contrasena-equivocada' });

    expect(res.status).toBe(401);
  });
});
