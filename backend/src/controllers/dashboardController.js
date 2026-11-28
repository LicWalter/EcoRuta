import { query } from '../config/db.js';

// Campos que siempre devuelve el resumen, todos como número (RF-22).
export const CAMPOS_RESUMEN = [
  'total_vehiculos',
  'vehiculos_operativos',
  'vehiculos_disponibles',
  'vehiculos_en_ruta',
  'vehiculos_mantenimiento',
  'total_conductores',
  'conductores_activos',
  'conductores_habilitados',
  'conductores_por_vencer',
  'total_rutas',
  'rutas_activas',
  'rutas_suspendidas',
  'rutas_programadas',
  'servicios_hoy',
  'servicios_conflicto',
  'total_localidades',
  'total_comunas',
  'total_barrios',
];

// Cualquier valor que no sea un número válido (null, texto, bigint en texto) se normaliza a número.
const aNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

// 42P01 = tabla o vista inexistente, 42883 = función inexistente: faltan migraciones.
const faltanMigraciones = (error) => error.code === '42P01' || error.code === '42883';

const responderSinMigrar = (res) =>
  res.status(503).json({
    error: 'Base de datos desactualizada',
    mensaje: 'La base de datos aún no tiene las migraciones del panel. Pide al equipo ejecutar "npm run migrate up".',
  });

/**
 * GET /api/admin/dashboard-resumen — indicadores del panel (RF-22 a RF-24)
 */
export const obtenerResumen = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM fn_dashboard_resumen()');
    const fila = rows[0] || {};
    const datos = Object.fromEntries(CAMPOS_RESUMEN.map((campo) => [campo, aNumero(fila[campo])]));

    return res.status(200).json({
      mensaje: 'Datos del resumen del panel obtenidos correctamente.',
      datos,
    });
  } catch (error) {
    if (faltanMigraciones(error)) return responderSinMigrar(res);
    next(error);
  }
};

/**
 * GET /api/admin/servicios-hoy — tabla "Servicios Programados Hoy" (RF-23)
 * Filtros opcionales: ?zona=Isla|Continente &comuna_id= &estado=en_curso|programada|conflicto
 */
export const listarServiciosHoy = async (req, res, next) => {
  try {
    const { zona, comuna_id: comunaId, estado } = req.consulta || {};
    const condiciones = [];
    const parametros = [];

    if (zona) {
      parametros.push(zona);
      condiciones.push(`LOWER(zona) = $${parametros.length}`);
    }
    if (comunaId) {
      parametros.push(comunaId);
      condiciones.push(`comuna_id = $${parametros.length}`);
    }
    if (estado) {
      parametros.push(estado);
      condiciones.push(`estado = $${parametros.length}`);
    }

    const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT id, ruta_id, ruta, sector, zona, comuna, vehiculo, conductor, hora_inicio, hora_fin, estado
         FROM fn_servicios_hoy()
         ${donde}
        ORDER BY hora_inicio, ruta`,
      parametros
    );

    return res.status(200).json({ datos: rows });
  } catch (error) {
    if (faltanMigraciones(error)) return responderSinMigrar(res);
    next(error);
  }
};
