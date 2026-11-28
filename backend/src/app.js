import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

const esProduccion = () => process.env.NODE_ENV === 'production';

/**
 * Orígenes permitidos por CORS (RNF-03).
 * - FRONTEND_URL admite una o varias URL separadas por comas
 *   (por ejemplo, https://ecoruta.netlify.app,https://otra.netlify.app).
 * - En desarrollo también se permite cualquier http://localhost:<puerto>.
 * - En producción solo se aceptan las URL de FRONTEND_URL.
 */
const origenesPermitidos = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

const origenPermitido = (origin) => {
  // Peticiones sin origen: Postman, Thunder Client, curl o llamadas entre servidores
  if (!origin) return true;
  if (origenesPermitidos().includes(origin)) return true;
  if (!esProduccion() && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    // Si el origen no está permitido, no se envían cabeceras CORS y el navegador bloquea la respuesta
    origin: (origin, callback) => callback(null, origenPermitido(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Endpoint de verificación de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    estado: 'ok',
    servicio: 'EcoRuta API Backend',
    fecha: new Date().toISOString(),
  });
});

// Enrutadores principales
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor.`,
  });
});

// Manejador global de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Cuerpo de la petición con JSON mal formado (lo detecta express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON inválido',
      mensaje: 'El cuerpo de la petición no es un JSON válido. Revisa comillas, comas y llaves.',
    });
  }

  const status = err.status || err.statusCode || 500;

  // Errores del cliente (4xx): solo se muestra el mensaje si es seguro hacerlo
  if (status < 500) {
    return res.status(status).json({
      error: 'Petición inválida',
      mensaje: err.expose && err.message ? err.message : 'La petición no se pudo procesar.',
    });
  }

  // Errores del servidor: se registran completos, pero al cliente solo se le da un mensaje genérico.
  // En desarrollo se agrega el detalle técnico para facilitar la depuración.
  console.error('Error no controlado en la aplicación:', err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    ...(esProduccion() ? {} : { detalle: err.message }),
  });
});

export default app;
