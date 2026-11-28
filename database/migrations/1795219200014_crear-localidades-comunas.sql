-- Up Migration
-- Estructura geografica oficial: localidad -> comuna -> barrio (RF-13, RF-31).
-- Buenaventura tiene 2 localidades y 12 comunas; son datos fijos y se cargan aqui.
-- Los 104 barrios se cargan con database/seeds/000_geografia.sql.

CREATE TABLE localidades (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  zona   VARCHAR(20) NOT NULL CHECK (zona IN ('isla', 'continente'))
);

CREATE TABLE comunas (
  id           SERIAL PRIMARY KEY,
  numero       SMALLINT NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 12),
  nombre       VARCHAR(50) NOT NULL UNIQUE,
  localidad_id INTEGER NOT NULL REFERENCES localidades(id) ON DELETE RESTRICT
);

CREATE INDEX comunas_localidad_idx ON comunas (localidad_id);

INSERT INTO localidades (nombre, zona) VALUES
  ('Isla de Cascajal', 'isla'),
  ('El Pailón',        'continente');

INSERT INTO comunas (numero, nombre, localidad_id)
SELECT x.numero, 'Comuna ' || x.numero, l.id FROM (VALUES
  (1,  'Isla de Cascajal'), (2,  'Isla de Cascajal'), (3,  'Isla de Cascajal'),
  (4,  'Isla de Cascajal'), (5,  'Isla de Cascajal'),
  (6,  'El Pailón'), (7,  'El Pailón'), (8,  'El Pailón'), (9,  'El Pailón'),
  (10, 'El Pailón'), (11, 'El Pailón'), (12, 'El Pailón')
) AS x(numero, localidad)
JOIN localidades l ON l.nombre = x.localidad;

-- La columna de texto "comuna" nunca se uso (el seed la dejaba vacia): se reemplaza por la relacion.
ALTER TABLE barrios DROP COLUMN comuna;
ALTER TABLE barrios ADD COLUMN comuna_id INTEGER REFERENCES comunas(id) ON DELETE RESTRICT;
CREATE INDEX barrios_comuna_idx ON barrios (comuna_id);

-- Down Migration
DROP INDEX barrios_comuna_idx;
ALTER TABLE barrios DROP COLUMN comuna_id;
ALTER TABLE barrios ADD COLUMN comuna VARCHAR(50);
DROP TABLE comunas;
DROP TABLE localidades;
