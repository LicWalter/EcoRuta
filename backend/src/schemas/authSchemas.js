import { z } from 'zod';

export const loginSchema = z
  .object({
    correo: z
      .string()
      .trim()
      .email('El formato del correo electrónico no es válido.')
      .optional(),
    email: z
      .string()
      .trim()
      .email('El formato del correo electrónico no es válido.')
      .optional(),
    contrasena: z
      .string()
      .min(1, 'La contraseña es requerida.')
      .optional(),
    password: z
      .string()
      .min(1, 'La contraseña es requerida.')
      .optional(),
  })
  .refine((data) => data.correo || data.email, {
    message: 'Debes proporcionar un correo electrónico (campo "correo" o "email").',
    path: ['correo'],
  })
  .refine((data) => data.contrasena || data.password, {
    message: 'Debes proporcionar una contraseña (campo "contrasena" o "password").',
    path: ['contrasena'],
  });
