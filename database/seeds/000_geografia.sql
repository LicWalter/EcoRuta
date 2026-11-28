-- Los 104 barrios oficiales de Buenaventura, por comuna (RF-13).
-- Fuente: listado oficial del Distrito (2 localidades, 12 comunas, 104 barrios).
-- Las localidades y comunas ya las crea la migracion 014; aqui solo van los barrios.
-- Se carga antes que 001_datos_prueba.sql. Es idempotente: se puede ejecutar mas de una vez.
-- Dos barrios se llaman "Alfonso López": se distinguen con el apellido completo (comuna 3 y comuna 12).

INSERT INTO barrios (nombre, comuna_id)
SELECT x.nombre, c.id FROM (VALUES
  -- Localidad Isla de Cascajal
  (1, 'Nayita'), (1, 'Centenario'), (1, 'La Isla'),
  (2, 'Vientos Libres Norte'), (2, 'Montechino'), (2, 'El Firme'), (2, 'Capricho'),
  (2, 'F. Paula Santander'), (2, 'El Jorge'), (2, 'Borrero Olano'), (2, 'Santa Rosa'),
  (3, 'Alfonso López Pumarejo'), (3, 'Alberto Lleras'),
  (4, 'San José'), (4, 'Muro Yusty'), (4, 'Vientos Libres Sur'), (4, 'Campo Alegre'), (4, 'La Playita'),
  (5, 'Pascual de Andagoya'), (5, 'La Palera'), (5, 'Punta del Este'), (5, 'Santa Cruz'),
  (5, 'La Inmaculada'), (5, 'Santa Fe'), (5, 'Miramar'),
  -- Localidad El Pailón
  (6, 'El Porvenir'), (6, 'El Campín'), (6, 'El Jardín'), (6, 'Brisas del Mar'), (6, 'Miraflores'),
  (6, 'El Oriente'), (6, 'Isla de la Paz'), (6, 'Barrio Naval'), (6, 'Bosque Municipal'), (6, 'La Comuna'),
  (7, 'Kennedy'), (7, 'San Luis'), (7, 'San Francisco'), (7, 'Municipal'), (7, 'Juan XXIII'),
  (7, 'Eucarístico'), (7, 'Rockefeller'), (7, '14 de Julio'),
  (8, 'Modelo'), (8, 'María Eugenia'), (8, 'Bella Vista'), (8, 'El Cristal'),
  (8, 'Transformación'), (8, 'Los Laureles'), (8, 'Ciudadela Colpuertos'),
  (9, 'San Buenaventura'), (9, 'Doña Cesi'), (9, '12 de Abril'), (9, '6 de Enero'),
  (9, 'Turbay Ayala'), (9, 'Nueva Buenaventura'),
  (10, 'Independencia'), (10, 'Urbanización Acuarela'), (10, 'Carlos Holmes'), (10, 'Las Américas'),
  (10, 'Bolívar'), (10, 'Camilo Torres'), (10, 'Urbanización Bahía'), (10, 'El Progreso'),
  (10, 'La Fortaleza'), (10, 'Urbanización Comunitaria'), (10, 'Los Álamos'),
  (10, 'Urbanización Confamar'), (10, 'Bello Horizonte'),
  (11, 'El Dorado'), (11, 'Antonio Nariño'), (11, 'Cascajal'), (11, 'El Carmen'), (11, 'Nueva Colombia'),
  (11, 'Los Pinos'), (11, 'Panamericano'), (11, 'Gran Colombiana'), (11, 'Cristóbal Colón'), (11, 'El Futuro'),
  (12, 'Puerta del Mar'), (12, 'Alfonso López Michelsen'), (12, 'Unión de Vivienda'), (12, 'El Triunfo'),
  (12, '20 de Julio'), (12, 'El Retén'), (12, 'Nueva Granada'), (12, 'Las Palmas'), (12, 'Nueva Frontera'),
  (12, 'Matía Mulumba'), (12, 'Cabal Pombo'), (12, 'El Caldas'), (12, 'La Libertad'), (12, 'La Gloria'),
  (12, 'La Unión'), (12, 'El Ruiz'), (12, 'Rafael Uribe'), (12, 'El Cambio'), (12, 'Nuevo Amanecer'),
  (12, 'La Campiña'), (12, 'Vista Hermosa'), (12, 'Jorge E. Gaitán'), (12, 'La Dignidad'),
  (12, 'Brisas del Pacífico'), (12, '12 de Octubre')
) AS x(comuna, nombre)
JOIN comunas c ON c.numero = x.comuna
ON CONFLICT (LOWER(nombre)) DO UPDATE SET comuna_id = EXCLUDED.comuna_id;
