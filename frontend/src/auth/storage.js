// Token y usuario en localStorage (ECO-4). Se borran al cerrar sesión.
const TOKEN = 'ecoruta_token';
const USER = 'ecoruta_usuario';
const TEMP = 'ecoruta_temporal'; // sesión sin "Recordar sesión"
const ACTIVA = 'ecoruta_activa'; // sessionStorage: marca que esta pestaña/navegador ya está en uso

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function getToken() {
  return safe(() => localStorage.getItem(TOKEN));
}

export function getUser() {
  return safe(() => JSON.parse(localStorage.getItem(USER) || 'null'));
}

export function saveSession(token, usuario, recordar) {
  safe(() => {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(USER, JSON.stringify(usuario || null));
    if (recordar) localStorage.removeItem(TEMP);
    else localStorage.setItem(TEMP, '1');
    sessionStorage.setItem(ACTIVA, '1');
  });
}

export function clearSession() {
  safe(() => {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
    localStorage.removeItem(TEMP);
    sessionStorage.removeItem(ACTIVA);
  });
}

/** Si la sesión era temporal y se abrió un navegador nuevo, se descarta. */
export function purgeTemporarySession() {
  safe(() => {
    if (localStorage.getItem(TEMP) && !sessionStorage.getItem(ACTIVA)) clearSession();
    else if (getToken()) sessionStorage.setItem(ACTIVA, '1');
  });
}
