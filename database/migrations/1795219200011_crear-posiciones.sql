-- Up Migration
-- Historial de posiciones de los camiones (RF-28, propio). Ver ECO-20.
-- Pensada para que un GPS real la use despues sin cambios: solo vehiculo, lat, lng, velocidad y hora.
CREATE TABLE posiciones (
  id              BIGSERIAL PRIMARY KEY,
  vehiculo_id     INTEGER      NOT NULL REFERENCES vehiculos(id)       ON DELETE CASCADE,
  programacion_id INTEGER               REFERENCES programaciones(id)  ON DELETE SET NULL,
  latitud         NUMERIC(9,6) NOT NULL CHECK (latitud  BETWEEN -90  AND 90),
  longitud        NUMERIC(9,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  velocidad_kmh   NUMERIC(5,1) CHECK (velocidad_kmh IS NULL OR velocidad_kmh >= 0),
  registrado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX posiciones_vehiculo_fecha_idx ON posiciones (vehiculo_id, registrado_en DESC);

-- Down Migration
DROP TABLE posiciones;
