// Crea (o actualiza) el administrador inicial. RF-05.
// Uso:  Lee ADMIN_EMAIL (o ADMIN_CORREO) y ADMIN_PASSWORD (o ADMIN_CONTRASENA) del .env
//       npm run crear-admin
//       (opcional: ADMIN_NOMBRE='Administrador EcoRuta')
// La contrasena se guarda con bcrypt; nunca se escribe en el repositorio (RNF-01).
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const correo = (process.env.ADMIN_EMAIL || process.env.ADMIN_CORREO || '').trim().toLowerCase();
const contrasena = process.env.ADMIN_PASSWORD || process.env.ADMIN_CONTRASENA || '';
const nombre = (process.env.ADMIN_NOMBRE || 'Administrador EcoRuta').trim();

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en backend/.env o variables de entorno');
  process.exit(1);
}
if (!correo || !correo.includes('@')) {
  console.error('Define ADMIN_EMAIL (o ADMIN_CORREO) con un correo valido.');
  process.exit(1);
}
if (contrasena.length < 8) {
  console.error('ADMIN_PASSWORD (o ADMIN_CONTRASENA) debe tener al menos 8 caracteres.');
  process.exit(1);
}

const local = /localhost|127\.0\.0\.1|[?&]host=\//.test(process.env.DATABASE_URL);
const cliente = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: local ? false : { rejectUnauthorized: true },
});

try {
  await cliente.connect();
  const hash = await bcrypt.hash(contrasena, 12);
  const { rows } = await cliente.query(
    `INSERT INTO usuarios (nombre, correo, contrasena_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT ((LOWER(correo))) DO UPDATE
       SET nombre = EXCLUDED.nombre, contrasena_hash = EXCLUDED.contrasena_hash, activo = TRUE
     RETURNING id, correo`,
    [nombre, correo, hash],
  );
  console.log(`Administrador listo: ${rows[0].correo} (id ${rows[0].id})`);
} catch (error) {
  console.error('No se pudo crear el administrador:', error.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
