import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ApiError, NetworkError } from '../../api/client.js';
import Notice from '../../components/Notice.jsx';
import Icon from '../../components/Icon.jsx';
import logo from '../../assets/logo-ecoruta.png';
import escudo from '../../assets/escudo-buenaventura.png';
import bma from '../../assets/logo-bma.png';
import heroImg from '../../assets/login-hero.jpg';

// Foto limpia del camión (sin textos). Si colocas src/assets/login-camion.jpg|png|webp, el panel izquierdo
// se arma con textos reales encima de esa foto. Si no existe, se usa login-hero.jpg (recorte del diseño aprobado).
const fotos = import.meta.glob('../../assets/login-camion.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const FOTO = Object.values(fotos)[0];

const BENEFICIOS = [
  ['shieldcheck', 'Gestión centralizada'],
  ['bars', 'Operación eficiente'],
  ['leaf', 'Ciudad más limpia'],
];

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = location.state?.from;
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ver, setVer] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const aviso = location.state?.motivo; // 'sesion' | 'expirada'

  async function onSubmit(e) {
    e.preventDefault();
    if (cargando) return;
    if (!correo.trim() || !contrasena) {
      setError({ titulo: 'Completa tus datos.', texto: 'Escribe tu usuario y tu contraseña para ingresar.', icon: 'alert' });
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await login(correo.trim(), contrasena, recordar);
      navigate(desde && desde !== '/login' ? desde : '/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof NetworkError) {
        setError({ icon: 'wifi', titulo: 'No pudimos conectar con el servidor.', texto: 'Inténtalo en unos segundos.' });
      } else if (err instanceof ApiError) {
        // Se muestra el mensaje que devuelve el backend: la primera frase como título y el resto debajo.
        const [titulo, ...resto] = (err.message || '').split(/(?<=\.)\s+/);
        setError({
          icon: err.status >= 500 ? 'wifi' : 'lock',
          titulo: titulo || 'El usuario o la contraseña son incorrectos.',
          texto: resto.join(' ') || (err.status >= 500 ? 'Inténtalo en unos segundos.' : 'Verifica tus datos e intenta nuevamente.'),
        });
      } else {
        setError({ icon: 'alert', titulo: err.message || 'Ocurrió un error inesperado.', texto: 'Intenta nuevamente.' });
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login">
      <aside
        className={`hero ${FOTO ? 'hero--live' : 'hero--baked'}`}
        style={{ backgroundImage: `url(${FOTO || heroImg})` }}
      >
        {FOTO && (
          <>
            <div className="hero__shade" />
            <div className="hero__brand">
              <img src={logo} alt="EcoRuta" />
              <span />
              <img src={escudo} alt="" />
            </div>
            <div className="hero__text">
              <span className="hero__tag">Acceso Restringido</span>
              <h2>Panel Administrativo</h2>
              <p>Gestión de vehículos, conductores, rutas y programación de recolección en Buenaventura.</p>
            </div>
            <div className="hero__bar">
              <img src={escudo} alt="" />
              <img src={bma} alt="" />
              <span>Distrito Especial de Buenaventura</span>
            </div>
          </>
        )}
      </aside>

      <section className="login__side">
        <Link to="/" className="login__back">
          <Icon name="back" size={22} /> Volver al inicio
        </Link>

        <div className="card-login">
          <svg className="card-login__blob" viewBox="0 0 220 120" aria-hidden="true">
            <path d="M0 0H190C150 8 120 30 90 58 60 86 30 100 0 116Z" fill="#0b6a4a" />
            <path d="M0 116C30 100 60 86 90 58 110 40 125 30 140 24 110 50 70 90 0 120Z" fill="#cfe9dc" opacity=".7" />
          </svg>
          <span className="card-login__shield">
            <Icon name="shieldlock" size={78} stroke={1.5} />
          </span>
          <h1>Iniciar sesión</h1>
          <p className="card-login__sub">Portal exclusivo para administradores</p>

          {error ? (
            <Notice tipo="error" icon={error.icon} titulo={error.titulo} texto={error.texto} />
          ) : aviso === 'sesion' ? (
            <Notice
              tipo="warn"
              icon="lock"
              titulo="Inicia sesión para continuar"
              texto="Necesitas una sesión de administrador para entrar a esa página."
            />
          ) : aviso === 'expirada' ? (
            <Notice tipo="warn" icon="lock" titulo="Tu sesión expiró" texto="Ingresa de nuevo para continuar." />
          ) : null}

          <form onSubmit={onSubmit} noValidate>
            <label className="field">
              <span>Usuario o correo institucional</span>
              <div className="input">
                <Icon name="user" size={22} />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="admin@ecoruta.co"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </label>
            <label className="field">
              <span>Contraseña</span>
              <div className="input">
                <Icon name="lock" size={22} />
                <input
                  type={ver ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <button
                  type="button"
                  className="input__eye"
                  aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setVer((v) => !v)}
                >
                  <Icon name={ver ? 'eye' : 'eyeoff'} size={22} />
                </button>
              </div>
            </label>
            <div className="login__row">
              <label className="check">
                <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
                <span>Recordar sesión</span>
              </label>
              {/* TODO: recuperación de contraseña (fuera de la entrega 1). */}
              <button type="button" className="link">¿Olvidaste tu contraseña?</button>
            </div>
            <button type="submit" className="btn" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Ingresar al panel'}
              {!cargando && <Icon name="arrow" size={26} stroke={1.6} />}
            </button>
          </form>

          <div className="seguro">
            <span>Acceso seguro y controlado</span>
          </div>
          <div className="beneficios">
            {BENEFICIOS.map(([ic, t]) => (
              <div key={t}>
                <Icon name={ic} size={32} stroke={1.5} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <svg className="login__wave" viewBox="0 0 300 300" aria-hidden="true">
          <path d="M300 60C250 110 230 170 150 230 110 260 60 280 20 300H300Z" fill="#dff1e8" />
          <path d="M300 150C260 190 230 240 190 300H300Z" fill="#cfe9dc" />
        </svg>
      </section>
    </div>
  );
}
