import jwt from 'jsonwebtoken';

export const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Acceso no autorizado: debes incluir un token Bearer en el encabezado Authorization.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno.');
    return res.status(500).json({
      error: 'Error de servidor',
      mensaje: 'Error en la configuración de seguridad del servidor.',
    });
  }

  try {
    const decodificado = jwt.verify(token, secret);
    req.usuario = decodificado;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Sesión expirada',
        mensaje: 'La sesión ha expirado. Por favor, inicia sesión nuevamente.',
      });
    }

    return res.status(401).json({
      error: 'Token inválido',
      mensaje: 'El token proporcionado es inválido o ha sido alterado.',
    });
  }
};
