# Perímetro urbano de Buenaventura

`zona-urbana.geojson`: polígono de la zona urbana (latitud y longitud, WGS84; en GeoJSON va [longitud, latitud]).

- **Fuente:** tabla de coordenadas del plano "Zonas urbana y de expansión aprobadas en el P.B.O.T. del año 2000" (Alcaldía Distrital, agosto de 2020), puntos 1 a 103.
- **Conversión:** de MAGNA-SIRGAS Colombia Oeste (origen 4°35'46.3215" N, 77°04'39.0285" O; EPSG:3115) a WGS84 con `pyproj`.
- **Uso:** dibujar el límite en el mapa (ECO-18) y validar que un trazado o un punto de recolección caiga dentro del área urbana. Es una referencia aproximada, no un límite legal.
- Área del polígono: unos 29 km². Centro aproximado: 3.870, -77.015.
- No incluye las zonas de expansión: el plano no indica qué puntos forman cada una.
