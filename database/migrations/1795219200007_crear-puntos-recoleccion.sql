-- Up Migration
-- Puntos de recoleccion de cada barrio (RF-17, propio del equipo). Ver ECO-19.
CREATE TABLE puntos_recoleccion (
  id         SERIAL PRIMARY KEY,
  barrio_id  INTEGER       NOT NULL REFERENCES barrios(id) ON DELETE CASCADE,
  nombre     VARCHAR(100)  NOT NULL,
  referencia VARCHAR(200),
  latitud    NUMERIC(9,6)  NOT NULL CHECK (latitud  BETWEEN -90  AND 90),
  longitud   NUMERIC(9,6)  NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  activo     BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX puntos_recoleccion_barrio_idx ON puntos_recoleccion (barrio_id);

-- Down Migration
DROP TABLE puntos_recoleccion;
