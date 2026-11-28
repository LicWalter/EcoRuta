import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { SECCIONES } from './nav.js';
import Icon from './Icon.jsx';
import logoBlanco from '../assets/logo-ecoruta-blanco.png';
import escudo from '../assets/escudo-buenaventura.png';
import faro from '../assets/faro.png';
import avatar from '../assets/avatar.png';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const nombre = user?.nombre || 'Administrador';

  function salir() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${abierto ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <img src={logoBlanco} alt="EcoRuta" />
          <span className="sidebar__sep" />
          <img src={escudo} alt="Escudo de Buenaventura" />
        </div>
        <nav className="sidebar__nav" onClick={() => setAbierto(false)}>
          {SECCIONES.map((s) => (
            <NavLink key={s.to} to={s.to} className="navlink">
              <Icon name={s.icon} size={24} />
              <span>{s.label}</span>
            </NavLink>
          ))}
        </nav>
        <img className="sidebar__faro" src={faro} alt="" />
        <div className="sidebar__user">
          <img src={avatar} alt="" />
          <div>
            <b>{nombre}</b>
            <span>{user?.rol === 'admin' || !user?.rol ? 'Administrador' : user.rol}</span>
          </div>
          <Icon name="gear" size={22} />
        </div>
        <button type="button" className="sidebar__logout" onClick={salir}>
          <Icon name="logout" size={24} />
          Cerrar sesión
        </button>
      </aside>
      {abierto && <div className="scrim" onClick={() => setAbierto(false)} />}
      <div className="main">
        <button type="button" className="burger" aria-label="Abrir menú" onClick={() => setAbierto(true)}>
          <Icon name="menu" />
        </button>
        <Outlet />
      </div>
    </div>
  );
}
