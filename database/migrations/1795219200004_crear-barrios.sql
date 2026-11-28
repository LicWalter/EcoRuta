-- Up Migration
-- Barrios o sectores de Buenaventura (RF-13)
CREATE TABLE barrios (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  comuna    VARCHAR(50),
  activo    BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX barrios_nombre_unico ON barrios (LOWER(nombre));

-- Down Migration
DROP TABLE barrios;
