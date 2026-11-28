-- Up Migration
-- Usuarios del panel administrativo (RF-01 a RF-05). Ver ECO-33.
CREATE TABLE usuarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(150) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,          -- bcrypt, nunca texto plano (RNF-01)
  rol             VARCHAR(20)  NOT NULL DEFAULT 'admin'
                  CHECK (rol IN ('admin')),
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Correo unico sin importar mayusculas/minusculas
CREATE UNIQUE INDEX usuarios_correo_unico ON usuarios (LOWER(correo));

-- Down Migration
DROP TABLE usuarios;
