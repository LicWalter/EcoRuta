-- Up Migration
-- Conductores (RF-10 a RF-12)
CREATE TABLE conductores (
  id                   SERIAL PRIMARY KEY,
  nombres              VARCHAR(100) NOT NULL,
  apellidos            VARCHAR(100) NOT NULL,
  documento            VARCHAR(20)  NOT NULL UNIQUE,     -- RF-11
  telefono             VARCHAR(20),
  numero_licencia      VARCHAR(30)  NOT NULL UNIQUE,     -- RF-11
  categoria_licencia   VARCHAR(3)   NOT NULL
                       CHECK (categoria_licencia IN ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3')),
  vencimiento_licencia DATE         NOT NULL,            -- RF-12
  estado               VARCHAR(10)  NOT NULL DEFAULT 'activo'
                       CHECK (estado IN ('activo', 'inactivo')),
  creado_en            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Down Migration
DROP TABLE conductores;
