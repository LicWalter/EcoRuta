import { Router } from 'express';
import { login, logout, obtenerPerfil } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validar } from '../middlewares/validar.js';
import { loginSchema } from '../schemas/authSchemas.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/login', validar(loginSchema), login);
router.post('/logout', logout);

// Rutas autenticadas
router.get('/perfil', autenticar, obtenerPerfil);

export default router;
