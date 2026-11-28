-- Datos de prueba de EcoRuta. TODO es ficticio: sirve para probar y para la demostracion.
-- Los barrios reales (con su comuna) los carga 000_geografia.sql, que se ejecuta antes que este archivo.
-- Los trazados y puntos son de ejemplo: rehacerlos desde el mapa del panel (entrega 3).
-- El administrador NO se crea aqui: se crea con `npm run crear-admin` (contrasena con bcrypt).
-- Se ejecuta con `npm run seed` (o `npm run seed -- --reset` para vaciar y volver a cargar).

-- Turnos (RF-18)
INSERT INTO turnos (nombre, hora_inicio, hora_fin) VALUES
  ('Mañana', '06:00', '14:00'),
  ('Tarde',  '14:00', '22:00'),
  ('Noche',  '22:00', '06:00');

-- Vehiculos (RF-07, RF-09): uno por cada estado
INSERT INTO vehiculos (placa, numero_interno, marca, modelo, capacidad_toneladas, estado) VALUES
  ('TUR101', 'C-01', 'Chevrolet', 'NPR 2022',     6.00, 'disponible'),
  ('TUR102', 'C-02', 'Hino',      '300 2021',     5.50, 'disponible'),
  ('TUR103', 'C-03', 'Isuzu',     'FTR 2020',    10.00, 'en_servicio'),
  ('TUR104', 'C-04', 'Chevrolet', 'NKR 2019',     4.50, 'mantenimiento'),
  ('TUR105', 'C-05', 'Hino',      '500 2018',     9.00, 'fuera_de_servicio');

-- Conductores (RF-10 a RF-12): datos ficticios
INSERT INTO conductores (nombres, apellidos, documento, telefono, numero_licencia, categoria_licencia, vencimiento_licencia, estado) VALUES
  ('Carlos Andrés', 'Mosquera Rivas', '1111111101', '3000000001', 'LIC-0001', 'C2', '2028-05-30', 'activo'),
  ('Luis Fernando', 'Caicedo Banguera', '1111111102', '3000000002', 'LIC-0002', 'C2', '2027-09-15', 'activo'),
  ('Jhon Edison',   'Angulo Preciado',  '1111111103', '3000000003', 'LIC-0003', 'C1', '2027-01-20', 'activo'),
  ('Wilson',        'Valencia Cuero',   '1111111104', '3000000004', 'LIC-0004', 'C2', '2026-10-01', 'inactivo');

-- Rutas con trazado de ejemplo (formato Leaflet [lat, lng]) (RF-14, RF-16)
INSERT INTO rutas (nombre, descripcion, tipo_servicio, estado, trazado) VALUES
  ('Ruta 1 · Centro', 'Recorrido por Bella Vista, Alberto Lleras y Kennedy', 'recoleccion', 'activa',
   '[[3.8801,-77.0312],[3.8815,-77.0290],[3.8832,-77.0265],[3.8850,-77.0240],[3.8868,-77.0218]]'::jsonb),
  ('Ruta 2 · Sur', 'Recorrido por Miraflores, El Cristal y Rockefeller', 'recoleccion', 'activa',
   '[[3.8760,-77.0330],[3.8745,-77.0305],[3.8730,-77.0280],[3.8718,-77.0255]]'::jsonb),
  ('Ruta 3 · Barrido Avenida', 'Barrido de la avenida principal', 'barrido', 'suspendida',
   '[[3.8790,-77.0270],[3.8800,-77.0250],[3.8812,-77.0230]]'::jsonb),
  ('Ruta 4 · Norte (sin trazado)', 'Ruta nueva todavia sin dibujar en el mapa', 'recoleccion', 'activa', NULL);

-- Barrios por ruta (RF-31)
INSERT INTO ruta_barrios (ruta_id, barrio_id)
SELECT r.id, b.id FROM (VALUES
  ('Ruta 1 · Centro', 'Bella Vista'), ('Ruta 1 · Centro', 'Alberto Lleras'), ('Ruta 1 · Centro', 'Kennedy'),
  ('Ruta 2 · Sur', 'Miraflores'), ('Ruta 2 · Sur', 'El Cristal'), ('Ruta 2 · Sur', 'Rockefeller'),
  ('Ruta 3 · Barrido Avenida', 'Santa Cruz'), ('Ruta 3 · Barrido Avenida', 'Alfonso López Pumarejo')
) AS x(ruta, barrio)
JOIN rutas r ON r.nombre = x.ruta
JOIN barrios b ON b.nombre = x.barrio;

-- Puntos de recoleccion (RF-17): ejemplos
INSERT INTO puntos_recoleccion (barrio_id, nombre, referencia, latitud, longitud)
SELECT b.id, x.nombre, x.referencia, x.lat, x.lng FROM (VALUES
  ('Bella Vista',   'Esquina del parque',  'Frente al parque principal', 3.8805, -77.0308),
  ('Alberto Lleras',       'Calle 2 con carrera 5', 'Junto a la tienda de la esquina', 3.8820, -77.0285),
  ('Kennedy', 'Cancha del barrio',   'Costado norte de la cancha', 3.8840, -77.0255),
  ('Miraflores',   'Entrada principal',   'Cerca de la parada del bus', 3.8752, -77.0312),
  ('El Cristal',      'Punto del colegio',   'Frente a la porteria', 3.8735, -77.0285)
) AS x(barrio, nombre, referencia, lat, lng)
JOIN barrios b ON b.nombre = x.barrio;

-- Programaciones (RF-19): una por cada camion de la simulacion (camion 1 y camion 2)
INSERT INTO programaciones (ruta_id, vehiculo_id, conductor_id, turno_id, fecha_inicio, fecha_fin, estado)
SELECT r.id, v.id, c.id, t.id, x.ini::date, x.fin::date, 'programada' FROM (VALUES
  ('Ruta 1 · Centro', 'TUR101', '1111111101', 'Mañana', '2026-12-01', '2026-12-31'),
  ('Ruta 2 · Sur',    'TUR102', '1111111102', 'Mañana', '2026-12-01', '2026-12-31')
) AS x(ruta, placa, doc, turno, ini, fin)
JOIN rutas r       ON r.nombre = x.ruta
JOIN vehiculos v   ON v.placa = x.placa
JOIN conductores c ON c.documento = x.doc
JOIN turnos t      ON t.nombre = x.turno;

-- Dias de cada programacion: Ruta 1 lunes, miercoles y viernes; Ruta 2 martes, jueves y sabado
INSERT INTO programacion_dias (programacion_id, dia_semana)
SELECT p.id, d.dia FROM programaciones p
JOIN rutas r ON r.id = p.ruta_id
JOIN LATERAL (
  SELECT UNNEST(CASE WHEN r.nombre = 'Ruta 1 · Centro' THEN ARRAY[1,3,5] ELSE ARRAY[2,4,6] END)::smallint AS dia
) d ON TRUE;
