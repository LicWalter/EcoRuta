-- Up Migration
-- Rutas de recoleccion y su trazado (RF-14 a RF-16)
CREATE TABLE rutas (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  tipo_servicio VARCHAR(20)  NOT NULL DEFAULT 'recoleccion'
                CHECK (tipo_servicio IN ('recoleccion', 'barrido')),
  estado        VARCHAR(15)  NOT NULL DEFAULT 'activa'
                CHECK (estado IN ('activa', 'suspendida')),
  -- Lista ordenada de puntos [[lat, lng], ...] en el formato de Leaflet (seccion 7.2).
  -- NULL = ruta todavia sin trazado (no se puede programar, RF-20).
  trazado       JSONB
                CHECK (trazado IS NULL OR (jsonb_typeof(trazado) = 'array' AND jsonb_array_length(trazado) >= 2)),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX rutas_nombre_unico ON rutas (LOWER(nombre));

-- Down Migration
DROP TABLE rutas;
