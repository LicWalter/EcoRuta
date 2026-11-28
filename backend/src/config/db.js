import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️  ADVERTENCIA: No se ha definido DATABASE_URL en el archivo .env');
}

const isLocal = /localhost|127\.0\.0\.1|[?&]host=\//.test(connectionString || '');

const pool = new Pool({
  connectionString,
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false, // Permite conexiones seguras a proveedores como Neon
      },
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
