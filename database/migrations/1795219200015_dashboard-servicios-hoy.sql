-- Up Migration
-- Apoyo SQL del dashboard con datos reales (ECO-12): indicadores, servicios de hoy y su estado por hora.
-- Las migraciones anteriores no se tocan: todo lo nuevo va aqui.
--
-- Zona horaria: Neon trabaja en UTC. Despues de las 7:00 p. m. en Buenaventura, CURRENT_DATE ya seria
-- el dia siguiente. Por eso estas funciones calculan "hoy" y "ahora" en America/Bogota a partir de
-- p_ahora (por defecto NOW()). Recibir p_ahora permite probarlas con una hora fija.

-- Sector principal de cada ruta: la comuna que tiene mas barrios de la ruta
-- (si empatan, la de menor numero). Las rutas sin barrios no aparecen en la vista.
CREATE VIEW v_rutas_sector AS
SELECT DISTINCT ON (rb.ruta_id)
  rb.ruta_id,
  c.id           AS comuna_id,
  c.numero       AS comuna_numero,
  c.nombre::TEXT AS comuna,
  l.nombre::TEXT AS localidad,
  INITCAP(l.zona) AS zona
FROM ruta_barrios rb
JOIN barrios     b ON b.id = rb.barrio_id
JOIN comunas     c ON c.id = b.comuna_id
JOIN localidades l ON l.id = c.localidad_id
GROUP BY rb.ruta_id, c.id, c.numero, c.nombre, l.nombre, l.zona
ORDER BY rb.ruta_id, COUNT(*) DESC, c.numero;

-- Programaciones en curso en un instante: la hora local cae dentro de su turno.
-- Un turno nocturno (22:00 a 06:00) esta en curso desde las 22:00 y hasta las 06:00 del dia siguiente,
-- siempre que la programacion aplique el dia en que el turno empezo.
CREATE FUNCTION fn_programaciones_en_curso(p_ahora TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE (programacion_id INTEGER)
LANGUAGE sql STABLE AS $$
  WITH ctx AS (
    SELECT (p_ahora AT TIME ZONE 'America/Bogota')::DATE AS hoy,
           (p_ahora AT TIME ZONE 'America/Bogota')::TIME AS hora
  )
  SELECT p.id
    FROM ctx, programaciones p
    JOIN turnos t ON t.id = p.turno_id
   WHERE p.estado = 'programada'
     AND (
       -- turno que empezo hoy
       ( ctx.hoy BETWEEN p.fecha_inicio AND p.fecha_fin
         AND EXISTS (SELECT 1 FROM programacion_dias d
                      WHERE d.programacion_id = p.id
                        AND d.dia_semana = EXTRACT(ISODOW FROM ctx.hoy)::SMALLINT)
         AND ctx.hora >= t.hora_inicio
         AND (t.hora_fin < t.hora_inicio OR ctx.hora < t.hora_fin) )
       OR
       -- turno nocturno que empezo ayer y termina esta madrugada
       ( t.hora_fin < t.hora_inicio
         AND ctx.hoy - 1 BETWEEN p.fecha_inicio AND p.fecha_fin
         AND EXISTS (SELECT 1 FROM programacion_dias d
                      WHERE d.programacion_id = p.id
                        AND d.dia_semana = EXTRACT(ISODOW FROM ctx.hoy - 1)::SMALLINT)
         AND ctx.hora < t.hora_fin )
     );
$$;

-- Servicios programados para hoy (tabla "Servicios Programados Hoy"), con su estado:
--   conflicto : otro servicio de hoy usa el mismo vehiculo o conductor en el mismo horario
--   en_curso  : la hora actual cae dentro del turno
--   programada: el resto
-- Si un servicio esta en curso y ademas tiene conflicto, se muestra como conflicto.
-- Reutiliza fn_servicios_del_dia, v_programaciones_detalle y fn_conflictos_programacion.
CREATE FUNCTION fn_servicios_hoy(p_ahora TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE (
  id          INTEGER,
  ruta_id     INTEGER,
  ruta        TEXT,
  sector      TEXT,
  zona        TEXT,
  comuna_id   INTEGER,
  comuna      TEXT,
  vehiculo    TEXT,
  conductor   TEXT,
  hora_inicio TEXT,
  hora_fin    TEXT,
  estado      TEXT
)
LANGUAGE sql STABLE AS $$
  WITH ctx AS (
    SELECT (p_ahora AT TIME ZONE 'America/Bogota')::DATE AS hoy
  ),
  en_curso AS (
    SELECT e.programacion_id FROM fn_programaciones_en_curso(p_ahora) e
  )
  SELECT s.programacion_id,
         s.ruta_id,
         s.ruta::TEXT,
         CASE WHEN rs.comuna_id IS NULL THEN 'Sin sector asignado'
              ELSE rs.comuna || ' · ' || rs.zona END,
         rs.zona,
         rs.comuna_id,
         rs.comuna,
         s.placa::TEXT,
         s.conductor::TEXT,
         TO_CHAR(s.hora_inicio, 'HH24:MI'),
         TO_CHAR(s.hora_fin, 'HH24:MI'),
         CASE
           WHEN EXISTS (
             SELECT 1 FROM fn_conflictos_programacion(
               s.vehiculo_id, s.conductor_id, s.turno_id, ctx.hoy, ctx.hoy,
               ARRAY[EXTRACT(ISODOW FROM ctx.hoy)::SMALLINT], s.programacion_id)
           ) THEN 'conflicto'
           WHEN s.programacion_id IN (SELECT programacion_id FROM en_curso) THEN 'en_curso'
           ELSE 'programada'
         END
    FROM ctx
    CROSS JOIN LATERAL fn_servicios_del_dia(ctx.hoy) s
    LEFT JOIN v_rutas_sector rs ON rs.ruta_id = s.ruta_id
   ORDER BY s.hora_inicio, s.ruta;
$$;

-- Indicadores del dashboard en una sola fila, todos INTEGER (nunca NULL).
-- Conserva los campos de v_resumen_dashboard y agrega los nuevos.
CREATE FUNCTION fn_dashboard_resumen(p_ahora TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE (
  total_vehiculos         INTEGER,
  vehiculos_operativos    INTEGER,
  vehiculos_disponibles   INTEGER,
  vehiculos_en_ruta       INTEGER,
  vehiculos_mantenimiento INTEGER,
  total_conductores       INTEGER,
  conductores_activos     INTEGER,
  conductores_habilitados INTEGER,
  conductores_por_vencer  INTEGER,
  total_rutas             INTEGER,
  rutas_activas           INTEGER,
  rutas_suspendidas       INTEGER,
  rutas_programadas       INTEGER,
  servicios_hoy           INTEGER,
  servicios_conflicto     INTEGER,
  total_localidades       INTEGER,
  total_comunas           INTEGER,
  total_barrios           INTEGER
)
LANGUAGE sql STABLE AS $$
  WITH ctx AS (
    SELECT (p_ahora AT TIME ZONE 'America/Bogota')::DATE AS hoy
  ),
  servicios AS (
    SELECT sh.estado AS estado_servicio FROM fn_servicios_hoy(p_ahora) sh
  )
  SELECT
    (SELECT COUNT(*) FROM vehiculos WHERE activo)::INTEGER,
    (SELECT COUNT(*) FROM vehiculos WHERE activo AND estado <> 'fuera_de_servicio')::INTEGER,
    (SELECT COUNT(*) FROM vehiculos WHERE activo AND estado = 'disponible')::INTEGER,
    (SELECT COUNT(DISTINCT p.vehiculo_id) FROM programaciones p
      WHERE p.id IN (SELECT e.programacion_id FROM fn_programaciones_en_curso(p_ahora) e))::INTEGER,
    (SELECT COUNT(*) FROM vehiculos WHERE activo AND estado = 'mantenimiento')::INTEGER,
    (SELECT COUNT(*) FROM conductores)::INTEGER,
    (SELECT COUNT(*) FROM conductores WHERE estado = 'activo')::INTEGER,
    (SELECT COUNT(*) FROM conductores c, ctx
      WHERE c.estado = 'activo' AND c.vencimiento_licencia >= ctx.hoy)::INTEGER,
    (SELECT COUNT(*) FROM conductores c, ctx
      WHERE c.estado = 'activo'
        AND c.vencimiento_licencia BETWEEN ctx.hoy AND ctx.hoy + 30)::INTEGER,
    (SELECT COUNT(*) FROM rutas)::INTEGER,
    (SELECT COUNT(*) FROM rutas WHERE estado = 'activa')::INTEGER,
    (SELECT COUNT(*) FROM rutas WHERE estado = 'suspendida')::INTEGER,
    (SELECT COUNT(*) FROM programaciones WHERE estado = 'programada')::INTEGER,
    (SELECT COUNT(*) FROM servicios)::INTEGER,
    (SELECT COUNT(*) FROM servicios WHERE estado_servicio = 'conflicto')::INTEGER,
    (SELECT COUNT(*) FROM localidades)::INTEGER,
    (SELECT COUNT(*) FROM comunas)::INTEGER,
    (SELECT COUNT(*) FROM barrios WHERE activo)::INTEGER;
$$;

-- Down Migration
DROP FUNCTION fn_dashboard_resumen(TIMESTAMPTZ);
DROP FUNCTION fn_servicios_hoy(TIMESTAMPTZ);
DROP FUNCTION fn_programaciones_en_curso(TIMESTAMPTZ);
DROP VIEW v_rutas_sector;
