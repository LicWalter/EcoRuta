-- Up Migration
-- Dias de la semana en que se repite cada programacion: 1 = lunes ... 7 = domingo
CREATE TABLE programacion_dias (
  programacion_id INTEGER  NOT NULL REFERENCES programaciones(id) ON DELETE CASCADE,
  dia_semana      SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  PRIMARY KEY (programacion_id, dia_semana)
);

-- Down Migration
DROP TABLE programacion_dias;
