import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getResumen, getServiciosHoy } from '../../api/endpoints.js';
import { ApiError } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import Icon from '../../components/Icon.jsx';
import mapa from '../../assets/mapa-simulacion.png';

// Lectura tolerante: el backend puede nombrar distinto los campos de v_resumen_dashboard (ver README).
// Postgres devuelve los conteos como texto ("5"): se convierten a número.
const pick = (o, ...keys) => {
  for (const k of keys) {
    if (o && o[k] !== undefined && o[k] !== null) {
      const n = Number(o[k]);
      return Number.isNaN(n) ? o[k] : n;
    }
  }
  return undefined;
};
const dash = (v) => (v === undefined ? '—' : v);

const ETIQUETA = { en_curso: 'En curso', programada: 'Programada', conflicto: 'Conflicto' };
const COLOR = { en_curso: 'ok', conflicto: 'warn', programada: 'idle' };

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);
  const [servicios, setServicios] = useState(null); // null = cargando
  const [errServicios, setErrServicios] = useState(null);
  const [zona, setZona] = useState('');
  const [comuna, setComuna] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    let vivo = true;
    getResumen()
      .then((d) => vivo && setR(d?.datos ?? d?.data ?? {}))
      .catch((err) => {
        if (!vivo) return;
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true, state: { motivo: 'expirada' } });
          return;
        }
        setError(err.message || 'No pudimos cargar el resumen.');
      });
    return () => {
      vivo = false;
    };
  }, [logout, navigate]);

  useEffect(() => {
    let vivo = true;
    getServiciosHoy()
      .then((d) => vivo && setServicios(d?.datos ?? d?.data ?? (Array.isArray(d) ? d : [])))
      .catch((err) => {
        if (!vivo) return;
        if (err instanceof ApiError && err.status === 401) return; // lo maneja el efecto del resumen
        setServicios([]);
        setErrServicios(err.message || 'No pudimos cargar los servicios de hoy.');
      });
    return () => {
      vivo = false;
    };
  }, []);

  const lista = useMemo(() => servicios || [], [servicios]);
  const zonas = useMemo(() => [...new Set(lista.map((s) => s.zona).filter(Boolean))], [lista]);
  const comunas = useMemo(() => [...new Set(lista.map((s) => s.comuna).filter(Boolean))], [lista]);
  const filas = useMemo(
    () => lista.filter((s) => (!zona || s.zona === zona) && (!comuna || s.comuna === comuna) && (!estado || s.estado === estado)),
    [lista, zona, comuna, estado],
  );

  const veh = pick(r, 'vehiculos_operativos', 'total_vehiculos');
  const dispo = pick(r, 'vehiculos_disponibles');
  const enRuta = pick(r, 'vehiculos_en_ruta');
  const cond = pick(r, 'conductores_habilitados', 'total_conductores');
  const activos = pick(r, 'conductores_activos');
  const porVencer = pick(r, 'conductores_por_vencer');
  const rutas = pick(r, 'rutas_activas');
  const susp = pick(r, 'rutas_suspendidas');
  const totalRutas = pick(r, 'total_rutas') ?? (rutas !== undefined && susp !== undefined ? rutas + susp : undefined);
  const serv = pick(r, 'servicios_hoy', 'servicios_programados');
  const conflicto = pick(r, 'servicios_conflicto', 'conflictos');
  const pct = (a, b) => (a !== undefined && b ? Math.min(100, Math.round((a / b) * 100)) : 0);

  return (
    <div className="dash">
      <header className="dash__head">
        <div>
          <h1>Panel Operativo · Buenaventura</h1>
          <p>
            {pick(r, 'total_localidades') !== undefined
              ? `${pick(r, 'total_localidades')} Localidades · ${pick(r, 'total_comunas')} Comunas · ${pick(r, 'total_barrios')} Barrios`
              : 'Buenaventura'}
          </p>
        </div>
        <div className="dash__actions">
          <div className="dash__row">
            {/* TODO: abrir el formulario de nueva programación (entrega 3). */}
            <button type="button" className="btn-new"><Icon name="plus" size={22} /> Nueva Programación</button>
            <button type="button" className="btn-bell" aria-label="Notificaciones"><Icon name="bell" size={24} /></button>
          </div>
          <button type="button" className="turno">Hoy · Turno Activo <Icon name="down" size={18} /></button>
        </div>
      </header>

      {error && <div className="notice notice--error dash__error" role="alert"><span className="notice__icon"><Icon name="alert" size={24} /></span><div className="notice__text"><strong>{error}</strong></div></div>}

      <div className="kpis">
        <Link to="/vehiculos" className="kpi">
          <h3>Vehículos Operativos</h3>
          <b className="kpi__n">{dash(veh)}</b>
          <svg className="spark" viewBox="0 0 250 40" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0b8450" stopOpacity=".28" /><stop offset="1" stopColor="#0b8450" stopOpacity="0" /></linearGradient></defs>
            <path d="M0 30C25 20 45 14 70 22S110 36 135 26 175 6 200 12 235 20 250 14V40H0Z" fill="url(#sg)" />
            <path d="M0 30C25 20 45 14 70 22S110 36 135 26 175 6 200 12 235 20 250 14" fill="none" stroke="#0b8450" strokeWidth="2" />
          </svg>
          <span className="kpi__d">{dispo !== undefined ? `${dispo} disp.` : ''}{enRuta !== undefined ? ` · ${enRuta} en ruta` : ''}</span>
        </Link>

        <Link to="/conductores" className="kpi">
          <h3>Conductores Habilitados</h3>
          <b className="kpi__n">{dash(cond)}</b>
          <div className="bar"><i style={{ width: `${pct(activos, cond)}%`, background: '#0b8450' }} /></div>
          <span className="kpi__d">{activos !== undefined ? `${activos} activos` : ''}{porVencer !== undefined ? ` · ${porVencer} por vencer` : ''}</span>
        </Link>

        <Link to="/barrios" className="kpi">
          <h3>Rutas Activas</h3>
          <b className="kpi__n">{dash(rutas)}</b>
          <div className="bar"><i style={{ width: `${pct(rutas, totalRutas) || 55}%`, background: '#1177c4' }} /></div>
          <span className="kpi__d kpi__d--right">{susp !== undefined && (<><u className="dot dot--idle" />{susp} suspendida{susp === 1 ? '' : 's'}</>)}</span>
        </Link>

        <Link to="/programacion" className="kpi">
          <h3>Servicios Hoy</h3>
          <b className="kpi__n">{dash(serv)}</b>
          <div className="seg"><i style={{ background: '#0b3b3c' }} /><i style={{ background: '#2fa36b' }} /><i style={{ background: '#a8dcc0' }} /><i style={{ background: '#f5a623' }} /><i style={{ background: '#e8761f' }} /><i style={{ background: '#e3e8ea' }} /></div>
          <span className="kpi__d kpi__d--right">{conflicto !== undefined && (<><u className="dot dot--warn" />{conflicto} conflicto{conflicto === 1 ? '' : 's'}</>)}</span>
        </Link>
      </div>

      <div className="dash__grid">
        <section className="panel">
          <h2><Icon name="calendar" size={30} /> Servicios Programados Hoy</h2>
          <div className="filtros">
            <label className="sel"><span>Zona:</span>
              <select value={zona} onChange={(e) => setZona(e.target.value)}>
                <option value="">Todas</option>{zonas.map((z) => <option key={z}>{z}</option>)}
              </select></label>
            <label className="sel"><span>Comuna:</span>
              <select value={comuna} onChange={(e) => setComuna(e.target.value)}>
                <option value="">Todas</option>{comunas.map((c) => <option key={c}>{c}</option>)}
              </select></label>
            <label className="sel"><span>Estado:</span>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option><option value="en_curso">En curso</option><option value="conflicto">Conflicto</option><option value="programada">Programada</option>
              </select></label>
          </div>
          <div className="tablewrap">
            <table className="tabla">
              <thead><tr><th>Ruta / Sector</th><th>Vehículo</th><th>Conductor</th><th>Horario</th><th>Estado</th><th>Mapa</th></tr></thead>
              <tbody>
                {servicios === null && <tr><td colSpan={6} className="vacio">Cargando servicios…</td></tr>}
                {servicios !== null && errServicios && <tr><td colSpan={6} className="vacio">{errServicios}</td></tr>}
                {servicios !== null && !errServicios && filas.length === 0 && (
                  <tr><td colSpan={6} className="vacio">No hay servicios programados para hoy.</td></tr>
                )}
                {filas.map((s) => (
                  <tr key={s.id} className={`row row--${COLOR[s.estado] || 'idle'}`}>
                    <td><b>{s.ruta}</b><small>{s.sector}</small></td>
                    <td>{s.vehiculo}</td><td>{s.conductor}</td><td>{s.hora_inicio} – {s.hora_fin}</td>
                    <td><span className="est"><u className={`dot dot--${COLOR[s.estado] || 'idle'}`} />{ETIQUETA[s.estado] || s.estado}</span></td>
                    <td><Link to="/mapa-rutas" state={{ rutaId: s.ruta_id }} className="vermapa">Ver mapa <Icon name="arrow" size={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2><Icon name="play" size={30} /> Simulación de Flota en Vivo <span className="chip"><u className="dot dot--ok" />2 camiones</span></h2>
          {/* TODO: reemplazar la imagen por el mapa real con la simulación (entrega de simulación). */}
          <img className="mapa" src={mapa} alt="Mapa de Buenaventura con dos camiones en ruta" />
          <div className="sim">
            <div className="sim__track"><i /></div>
            <div className="sim__row">
              <button type="button" className="sim__btn"><Icon name="pause" size={16} stroke={3} /> Pausar</button>
              <span>1x / 2x</span>
              <span className="toggle" aria-hidden="true"><i /></span>
              <span className="sim__cada">Cada 5s <Icon name="down" size={18} /></span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
