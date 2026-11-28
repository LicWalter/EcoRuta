import { z } from 'zod';

// Un parámetro vacío (?zona=) se trata como "sin filtro", igual que si no viniera.
const opcional = (schema) => z.preprocess((valor) => (valor === '' ? undefined : valor), schema.optional());

export const ESTADOS_SERVICIO = ['en_curso', 'programada', 'conflicto'];

/**
 * Filtros de GET /api/admin/servicios-hoy
 *   zona      : Isla o Continente (sin distinguir mayúsculas)
 *   comuna_id : id de la comuna (número entero positivo)
 *   estado    : en_curso, programada o conflicto
 */
export const serviciosHoySchema = z.object({
  zona: opcional(
    z
      .string({ error: 'La zona debe ser Isla o Continente.' })
      .trim()
      .toLowerCase()
      .pipe(z.enum(['isla', 'continente'], { error: 'La zona debe ser Isla o Continente.' }))
  ),
  comuna_id: opcional(
    z.coerce
      .number({ error: 'El identificador de la comuna debe ser un número entero positivo.' })
      .int({ error: 'El identificador de la comuna debe ser un número entero positivo.' })
      .positive({ error: 'El identificador de la comuna debe ser un número entero positivo.' })
  ),
  estado: opcional(
    z.enum(ESTADOS_SERVICIO, { error: 'El estado debe ser en_curso, programada o conflicto.' })
  ),
});
