-- Up Migration
-- Programacion del servicio (RF-19 a RF-21). Ruta + vehiculo + conductor + turno + rango de fechas.
-- Las reglas de RF-20 (vehiculo/conductor/ruta validos) y RF-21 (conflictos) se aplican en el
-- backend antes de guardar; la funcion fn_conflictos_programacion (migracion 13) ayuda a detectarlos.
CREATE TABLE programaciones (
  id           SERIAL PRIMARY KEY,
  ruta_id      INTEGER     NOT NULL REFERENCES rutas(id)       ON DELETE RESTRICT,
  vehiculo_id  INTEGER     NOT NULL REFERENCES vehiculos(id)   ON DELETE RESTRICT,
  conductor_id INTEGER     NOT NULL REFERENCES conductores(id) ON DELETE RESTRICT,
  turno_id     INTEGER     NOT NULL REFERENCES turnos(id)      ON DELETE RESTRICT,
  fecha_inicio DATE        NOT NULL,
  fecha_fin    DATE        NOT NULL,
  estado       VARCHAR(15) NOT NULL DEFAULT 'programada'
               CHECK (estado IN ('programada', 'cancelada', 'inactiva')),
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT programaciones_fechas_validas CHECK (fecha_fin >= fecha_inicio)
);

CREATE INDEX programaciones_ruta_idx      ON programaciones (ruta_id);
CREATE INDEX programaciones_vehiculo_idx  ON programaciones (vehiculo_id, fecha_inicio, fecha_fin);
CREATE INDEX programaciones_conductor_idx ON programaciones (conductor_id, fecha_inicio, fecha_fin);
CREATE INDEX programaciones_turno_idx     ON programaciones (turno_id);

-- Down Migration
DROP TABLE programaciones;
