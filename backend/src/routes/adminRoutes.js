import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { soloAdmin } from '../middlewares/soloAdmin.js';
import { validarConsulta } from '../middlewares/validar.js';
import { obtenerResumen, listarServiciosHoy } from '../controllers/dashboardController.js';
import { serviciosHoySchema } from '../schemas/dashboardSchemas.js';

const router = Router();

// Todas las rutas de este router requieren autenticación y rol de administrador (RF-04):
// 401 si no hay token o es inválido, 403 si el usuario no es administrador.
router.use(autenticar, soloAdmin);

/**
 * Verificar estado y permisos del administrador
 */
router.get('/verificar', (req, res) => {
  return res.status(200).json({
    autorizado: true,
    mensaje: 'Acceso autorizado al panel de administración.',
    admin: req.usuario,
  });
});

// Indicadores del dashboard con datos reales (RF-22 a RF-24)
router.get('/dashboard-resumen', obtenerResumen);

// Servicios programados de hoy, con filtros por zona, comuna y estado (RF-23, RF-24)
router.get('/servicios-hoy', validarConsulta(serviciosHoySchema), listarServiciosHoy);

export default router;
