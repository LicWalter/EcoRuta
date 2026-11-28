-- Up Migration
-- Apoyo SQL para el dashboard (RF-22 a RF-24) y la deteccion de conflictos (RF-21).
-- Los indicadores salen de aqui: ningun valor se escribe a mano.

-- Indicadores del dashboard en una sola fila (GET /api/dashboard/resumen)
CREATE VIEW v_resumen_dashboard AS
SELECT
  (SELECT COUNT(*) FROM vehiculos   WHERE activo)                                   AS total_vehiculos,
  (SELECT COUNT(*) FROM vehiculos   WHERE activo AND estado = 'disponible')         AS vehiculos_disponibles,
  (SELECT COUNT(*) FROM vehiculos   WHERE activo AND estado = 'mantenimiento')      AS vehiculos_mantenimiento,
  (SELECT COUNT(*) FROM conductores)                                                AS total_conductores,
  (SELECT COUNT(*) FROM conductores WHERE estado = 'activo')                        AS conductores_activos,
  (SELECT COUNT(*) FROM rutas)                                                      AS total_rutas,
  (SELECT COUNT(*) FROM rutas       WHERE estado = 'activa')                        AS rutas_activas,
  (SELECT COUNT(*) FROM rutas       WHERE estado = 'suspendida')                    AS rutas_suspendidas,
  (SELECT COUNT(*) FROM programaciones WHERE estado = 'programada')                 AS rutas_programadas;

-- Programaciones con sus nombres, dias y turno: base de la tabla "servicios del dia" (RF-23)
-- y de los filtros por fecha, ruta, conductor y vehiculo (RF-24).
CREATE VIEW v_programaciones_detalle AS
SELECT
  p.id                                         AS programacion_id,
  p.estado,
  p.fecha_inicio,
  p.fecha_fin,
  r.id                                         AS ruta_id,
  r.nombre                                     AS ruta,
  (r.trazado IS NOT NULL)                      AS ruta_con_trazado,
  v.id                                         AS vehiculo_id,
  v.placa,
  c.id                                         AS conductor_id,
  c.nombres || ' ' || c.apellidos              AS conductor,
  t.id                                         AS turno_id,
  t.nombre                                     AS turno,
  t.hora_inicio,
  t.hora_fin,
  COALESCE(
    (SELECT ARRAY_AGG(d.dia_semana ORDER BY d.dia_semana)
       FROM programacion_dias d WHERE d.programacion_id = p.id),
    ARRAY[]::SMALLINT[]
  )                                            AS dias_semana
FROM programaciones p
JOIN rutas       r ON r.id = p.ruta_id
JOIN vehiculos   v ON v.id = p.vehiculo_id
JOIN conductores c ON c.id = p.conductor_id
JOIN turnos      t ON t.id = p.turno_id;

-- Servicios de una fecha concreta. Uso: SELECT * FROM fn_servicios_del_dia(CURRENT_DATE);
-- ISODOW devuelve 1 = lunes ... 7 = domingo, igual que programacion_dias.dia_semana.
CREATE FUNCTION fn_servicios_del_dia(p_fecha DATE)
RETURNS SETOF v_programaciones_detalle
LANGUAGE sql STABLE AS $$
  SELECT d.*
    FROM v_programaciones_detalle d
   WHERE d.estado = 'programada'
     AND p_fecha BETWEEN d.fecha_inicio AND d.fecha_fin
     AND EXTRACT(ISODOW FROM p_fecha)::SMALLINT = ANY (d.dias_semana)
   ORDER BY d.hora_inicio, d.ruta;
$$;

-- Conflictos de vehiculo o conductor (RF-21).
-- Hay conflicto cuando otra programacion 'programada' del mismo vehiculo o del mismo conductor
-- coincide en fechas, en al menos un dia de la semana y en el horario del turno.
-- Los turnos que cruzan la medianoche se tratan como un intervalo que termina al dia siguiente.
-- Uso al crear:  SELECT * FROM fn_conflictos_programacion(veh, cond, turno, '2026-12-01', '2026-12-31', ARRAY[1,3,5]);
-- Uso al editar: pasar como ultimo parametro el id de la programacion que se edita, para ignorarla.
CREATE FUNCTION fn_conflictos_programacion(
  p_vehiculo_id  INTEGER,
  p_conductor_id INTEGER,
  p_turno_id     INTEGER,
  p_fecha_inicio DATE,
  p_fecha_fin    DATE,
  p_dias         SMALLINT[],
  p_ignorar_id   INTEGER DEFAULT NULL
)
RETURNS TABLE (programacion_id INTEGER, tipo_conflicto TEXT)
LANGUAGE sql STABLE AS $$
  WITH nuevo AS (
    SELECT (hora_inicio - TIME '00:00') AS ini,
           (hora_fin - TIME '00:00') + CASE WHEN hora_fin > hora_inicio THEN INTERVAL '0' ELSE INTERVAL '24 hours' END AS fin
      FROM turnos WHERE id = p_turno_id
  ),
  otros AS (
    SELECT p.id, p.vehiculo_id, p.conductor_id,
           (t.hora_inicio - TIME '00:00') AS ini,
           (t.hora_fin - TIME '00:00') + CASE WHEN t.hora_fin > t.hora_inicio THEN INTERVAL '0' ELSE INTERVAL '24 hours' END AS fin
      FROM programaciones p
      JOIN turnos t ON t.id = p.turno_id
     WHERE p.estado = 'programada'
       AND (p_ignorar_id IS NULL OR p.id <> p_ignorar_id)
       AND p.fecha_inicio <= p_fecha_fin
       AND p.fecha_fin    >= p_fecha_inicio
       AND EXISTS (SELECT 1 FROM programacion_dias d
                    WHERE d.programacion_id = p.id AND d.dia_semana = ANY (p_dias))
  )
  SELECT o.id, 'vehiculo'::TEXT
    FROM otros o, nuevo n
   WHERE o.vehiculo_id = p_vehiculo_id AND o.ini < n.fin AND n.ini < o.fin
  UNION ALL
  SELECT o.id, 'conductor'::TEXT
    FROM otros o, nuevo n
   WHERE o.conductor_id = p_conductor_id AND o.ini < n.fin AND n.ini < o.fin;
$$;

-- Down Migration
DROP FUNCTION fn_conflictos_programacion(INTEGER, INTEGER, INTEGER, DATE, DATE, SMALLINT[], INTEGER);
DROP FUNCTION fn_servicios_del_dia(DATE);
DROP VIEW v_programaciones_detalle;
DROP VIEW v_resumen_dashboard;
