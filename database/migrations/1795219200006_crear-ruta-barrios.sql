-- Up Migration
-- Barrios por los que pasa cada ruta (alimenta el panel ciudadano, RF-31)
CREATE TABLE ruta_barrios (
  ruta_id   INTEGER NOT NULL REFERENCES rutas(id)   ON DELETE CASCADE,
  barrio_id INTEGER NOT NULL REFERENCES barrios(id) ON DELETE RESTRICT,
  PRIMARY KEY (ruta_id, barrio_id)
);

CREATE INDEX ruta_barrios_barrio_idx ON ruta_barrios (barrio_id);

-- Down Migration
DROP TABLE ruta_barrios;
