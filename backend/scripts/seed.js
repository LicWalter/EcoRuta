// Carga los archivos SQL de database/seeds (en orden alfabetico) en la base de DATABASE_URL.
// Uso:  npm run seed            -> carga los datos de prueba
//       npm run seed -- --reset -> vacia las tablas de datos (no usuarios) y vuelve a cargar
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const carpeta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/seeds');
const reiniciar = process.argv.includes('--reset');

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Copia .env.example como backend/.env y pega la cadena de Neon (rama dev).');
  process.exit(1);
}

// Neon exige SSL; en una base local (localhost) no hace falta.
const local = /localhost|127\.0\.0\.1|[?&]host=\//.test(process.env.DATABASE_URL);
const cliente = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: local ? false : { rejectUnauthorized: true },
});

const archivos = fs.readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort();

try {
  await cliente.connect();
  await cliente.query('BEGIN');
  if (reiniciar) {
    // usuarios no se toca: asi no se pierde el administrador inicial
    await cliente.query(`TRUNCATE ultima_posicion, posiciones, programacion_dias, programaciones,
      puntos_recoleccion, ruta_barrios, rutas, barrios, turnos, conductores, vehiculos RESTART IDENTITY CASCADE`);
    console.log('Tablas de datos vaciadas.');
  }
  for (const archivo of archivos) {
    await cliente.query(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
    console.log(`Cargado ${archivo}`);
  }
  await cliente.query('COMMIT');
  console.log('Datos de prueba listos.');
} catch (error) {
  await cliente.query('ROLLBACK').catch(() => {});
  if (error.code === '23505') {
    console.error('Los datos de prueba ya existen. Usa `npm run seed -- --reset` para vaciar y volver a cargar.');
  } else {
    console.error('Error al cargar los datos:', error.message);
  }
  process.exitCode = 1;
} finally {
  await cliente.end();
}
