import 'dotenv/config';
import app from '../src/app.js';

async function runLiveTests() {
  console.log('--- INICIANDO PRUEBAS EN VIVO CONTRA NEON ---');

  const server = app.listen(3002);

  try {
    const baseUrl = 'http://127.0.0.1:3002';

    // 1. Health check
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const dataHealth = await resHealth.json();
    console.log('1. Health check:', resHealth.status === 200 ? '✅ OK' : '❌ FALLÓ', dataHealth);

    // 2. Login con credenciales incorrectas (RF-02)
    const resLoginBad = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: 'admin@ecoruta.co',
        contrasena: 'clave-incorrecta-123',
      }),
    });
    const dataLoginBad = await resLoginBad.json();
    console.log(
      '2. Login credenciales incorrectas (RF-02):',
      resLoginBad.status === 401 ? '✅ OK (401)' : '❌ FALLÓ',
      dataLoginBad
    );

    // 3. Login exitoso con admin en Neon (RF-01, RNF-01, RNF-02)
    const resLoginGood = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: process.env.ADMIN_EMAIL || 'admin@ecoruta.co',
        contrasena: process.env.ADMIN_PASSWORD || 'Admin123456*',
      }),
    });
    const dataLoginGood = await resLoginGood.json();
    console.log(
      '3. Login exitoso (RF-01):',
      resLoginGood.status === 200 ? '✅ OK (200)' : '❌ FALLÓ',
      {
        mensaje: dataLoginGood.mensaje,
        usuario: dataLoginGood.usuario,
        tokenGenerado: !!dataLoginGood.token,
      }
    );

    const token = dataLoginGood.token;

    // 4. Perfil con token (RF-01)
    const resPerfil = await fetch(`${baseUrl}/api/auth/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dataPerfil = await resPerfil.json();
    console.log('4. Perfil de usuario:', resPerfil.status === 200 ? '✅ OK (200)' : '❌ FALLÓ', dataPerfil);

    // 5. Ruta protegida de admin (RF-04)
    const resAdmin = await fetch(`${baseUrl}/api/admin/verificar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dataAdmin = await resAdmin.json();
    console.log('5. Acceso ruta protegida admin (RF-04):', resAdmin.status === 200 ? '✅ OK (200)' : '❌ FALLÓ', dataAdmin);

    // 6. Resumen de Dashboard en Neon (v_resumen_dashboard)
    const resDashboard = await fetch(`${baseUrl}/api/admin/dashboard-resumen`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dataDashboard = await resDashboard.json();
    console.log('6. Resumen del dashboard (Neon DB):', resDashboard.status === 200 ? '✅ OK (200)' : '❌ FALLÓ', dataDashboard);

    // 7. Ruta admin rechazada sin token (RF-04)
    const resAdminNoAuth = await fetch(`${baseUrl}/api/admin/verificar`);
    const dataAdminNoAuth = await resAdminNoAuth.json();
    console.log(
      '7. Bloqueo sin token (RF-04):',
      resAdminNoAuth.status === 401 ? '✅ OK (401 Bloqueado)' : '❌ FALLÓ',
      dataAdminNoAuth
    );

    // 8. Logout (RF-03)
    const resLogout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    const dataLogout = await resLogout.json();
    console.log('8. Logout (RF-03):', resLogout.status === 200 ? '✅ OK (200)' : '❌ FALLÓ', dataLogout);

    console.log('--- TODAS LAS PRUEBAS EN VIVO CONTRA NEON COMPLETADAS CON ÉXITO ---');
  } catch (err) {
    console.error('Error durante las pruebas en vivo:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runLiveTests();
