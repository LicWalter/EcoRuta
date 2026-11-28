-- Up Migration
-- Ultima posicion conocida de cada camion: una fila por vehiculo.
-- El mapa y el panel ciudadano consultan esta tabla cada 5 s (RNF-09), no el historial.
-- El backend la actualiza con: INSERT ... ON CONFLICT (vehiculo_id) DO UPDATE
CREATE TABLE ultima_posicion (
  vehiculo_id     INTEGER      PRIMARY KEY REFERENCES vehiculos(id)      ON DELETE CASCADE,
  programacion_id INTEGER               REFERENCES programaciones(id)    ON DELETE SET NULL,
  latitud         NUMERIC(9,6) NOT NULL CHECK (latitud  BETWEEN -90  AND 90),
  longitud        NUMERIC(9,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  registrado_en   TIMESTAMPTZ  NOT NULL
);

-- Down Migration
DROP TABLE ultima_posicion;
