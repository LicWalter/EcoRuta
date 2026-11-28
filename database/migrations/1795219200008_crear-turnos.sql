-- Up Migration
-- Turnos de trabajo (RF-18). Ejemplo: manana, de 06:00 a 14:00
CREATE TABLE turnos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL,
  hora_inicio TIME        NOT NULL,
  hora_fin    TIME        NOT NULL,
  activo      BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un turno nocturno puede cruzar la medianoche (22:00 a 06:00), pero no durar 0 horas
  CONSTRAINT turnos_horas_distintas CHECK (hora_inicio <> hora_fin)
);

CREATE UNIQUE INDEX turnos_nombre_unico ON turnos (LOWER(nombre));

-- Down Migration
DROP TABLE turnos;
