export const validar = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errores = result.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }));

      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    req.body = result.data;
    next();
  };
};

/**
 * Valida los parámetros de consulta (?clave=valor). El resultado queda en req.consulta,
 * porque en Express 5 req.query es de solo lectura.
 */
export const validarConsulta = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const detalles = result.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }));

      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: detalles[0].mensaje,
        detalles,
      });
    }

    req.consulta = result.data;
    next();
  };
};
