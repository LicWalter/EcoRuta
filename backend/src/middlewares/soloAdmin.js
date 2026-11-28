export const soloAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      error: 'No autenticado',
      mensaje: 'Debes iniciar sesión para acceder a este recurso.',
    });
  }

  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      mensaje: 'Acceso restringido: no tienes permisos de administrador para realizar esta acción.',
    });
  }

  next();
};
