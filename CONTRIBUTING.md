# Guía de trabajo del equipo

El profesor evalúa los aportes individuales a partir de GitHub. Estas reglas garantizan que cada aporte quede claramente identificado, ordenado y siguiendo el flujo real acordado por el equipo.

---

## 1. Antes de empezar

- Cada integrante trabaja con **su propia cuenta de GitHub**.
- Configura tu nombre y correo en git con los mismos datos de tu cuenta de GitHub, para que tus commits queden atribuidos a tu usuario:
  ```bash
  git config --global user.name "Tu Nombre"
  git config --global user.email "correo-de-tu-cuenta-github"
  ```
  *(o sin `--global` para configurarlo únicamente en este repositorio).*
- **Nunca subas contraseñas, claves secretas ni archivos `.env`**. Las variables sensibles se configuran en el proveedor de despliegue (Render / Netlify). Consulta siempre `.env.example` como plantilla.

---

## 2. Flujo de ramas (Gitflow del equipo)

El equipo utiliza un flujo basado en dos ramas principales y ramas por tarea:

```text
main  (Producción / Releases oficiales: semana-1, semana-2...)
 ▲
 │  (El líder fusiona Dev a main al cierre de cada entrega)
 │
Dev   (Integración del equipo / Base de desarrollo)
 ▲
 │  (Pull Requests hacia Dev con revisión)
 │
feature/ECO-X / fix/ECO-X / docs/ECO-X (Ramas por tarea)
```

- **`main`**: Rama de producción y código estable. Nadie comitea ni abre Pull Requests directamente hacia `main`. Al cierre de cada entrega, el líder fusiona `Dev` en `main` y publica el release correspondiente.
- **`Dev`**: Rama de integración activa y base para todo el equipo. **Todas las tareas parten de `Dev` y todos los Pull Requests deben abrirse hacia `Dev`**.
- **Ramas por tarea**: Se crea una rama por cada tarea de Linear partiendo siempre de la versión más reciente de `Dev`.

### Convención de nombres para ramas:
Usa el prefijo del tipo de tarea seguido del código de Linear en mayúsculas y una descripción breve en minúsculas separada por guiones:
- `feature/ECO-XX-descripcion-breve` (para nuevas funcionalidades)
- `fix/ECO-XX-descripcion-breve` (para corrección de errores)
- `docs/ECO-XX-descripcion-breve` (para documentación)

*Ejemplos:* `feature/ECO-8-api-vehiculos`, `fix/ECO-4-error-login`, `docs/ECO-36-contributing-dev`.

---

## 3. Código ECO en ramas, commits y Pull Requests

Para mantener la trazabilidad entre Linear y GitHub, el código de la tarea (**ECO-XX**) debe estar presente en:

1. **La rama:** `feature/ECO-3-autenticacion-backend`
2. **Los commits:** Breves, en español y con verbo en imperativo, referenciando la tarea al final:
   - `Agrega validación de placa única (ECO-8)`
   - `Corrige expiración del token JWT (ECO-4)`
   - `Actualiza guía de contribución para flujo con Dev (ECO-36)`
3. **El Pull Request:** El título debe comenzar con el código de Linear:
   - `ECO-36: Actualizar CONTRIBUTING.md y la plantilla de PR al flujo real con la rama Dev`

---

## 4. Cómo traer cambios de `Dev` a tu rama antes de abrir el PR

Para evitar conflictos y asegurar que tu trabajo sea compatible con lo que otros compañeros ya fusionaron en `Dev`:

1. Asegúrate de tener tus cambios comiteados en tu rama de trabajo.
2. Descarga y fusiona las novedades de `Dev`:
   ```bash
   git fetch origin Dev
   git merge origin/Dev
   ```
3. Si hay conflictos, resuélvelos en tu editor y confirma que las pruebas sigan pasando:
   ```bash
   cd backend && npm test
   ```
4. Sube tu rama actualizada a GitHub:
   ```bash
   git push origin tu-rama
   ```

---

## 5. Pull Requests y revisiones

1. Sube tu rama a GitHub y abre un Pull Request con **rama base `Dev`** (¡nunca hacia `main`!).
2. Completa la plantilla de PR (`.github/pull_request_template.md`): código de Linear, qué cambia, cómo probarlo y lista de verificación.
3. Asigna la revisión al líder (Integrante 1) o a otro compañero del equipo.
4. **Fusión:** Una vez aprobado y verificado que los tests pasen:
   - Se fusiona utilizando **Merge commit** (no squash), para conservar el historial y la autoría de cada commit individual.
   - Se **elimina la rama remota** después de la fusión para mantener limpio el repositorio.

---

## 6. Entregas y releases

- Cada entrega oficial se publica mediante un release en GitHub sobre la rama `main`: `semana-1`, `semana-2`, `semana-3`, `semana-4`.
- El release debe corresponder exactamente al código que muestra la evidencia funcional.
- Las capturas de pantalla y videos se organizan en `docs/evidencia/`, nunca en archivos ZIP ni por correo.
- El líder publica el enlace del repositorio y del release en el foro de la universidad antes del cierre (lunes, 11:59 p. m.) y envía las credenciales por Teams.
