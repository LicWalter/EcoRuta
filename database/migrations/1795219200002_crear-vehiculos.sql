-- Up Migration
-- Vehiculos recolectores (RF-07 a RF-09)
CREATE TABLE vehiculos (
  id                  SERIAL PRIMARY KEY,
  placa               VARCHAR(10)  NOT NULL UNIQUE,       -- RF-08
  numero_interno      VARCHAR(20),
  marca               VARCHAR(50),
  modelo              VARCHAR(50),
  capacidad_toneladas NUMERIC(5,2) CHECK (capacidad_toneladas IS NULL OR capacidad_toneladas > 0),
  estado              VARCHAR(20)  NOT NULL DEFAULT 'disponible'
                      CHECK (estado IN ('disponible', 'en_servicio', 'mantenimiento', 'fuera_de_servicio')),  -- RF-09
  activo              BOOLEAN      NOT NULL DEFAULT TRUE,  -- "desactivar" no borra el registro
  creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Down Migration
DROP TABLE vehiculos;
