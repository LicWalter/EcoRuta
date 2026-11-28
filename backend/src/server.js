import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor EcoRuta corriendo`);
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log(`🔒 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS permitido: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`=========================================`);
});
