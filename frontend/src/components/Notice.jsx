import Icon from './Icon.jsx';

/** Aviso del login (ámbar = sesión requerida, rojo = error). */
export default function Notice({ tipo = 'error', icon, titulo, texto }) {
  return (
    <div className={`notice notice--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span className="notice__icon">
        <Icon name={icon || 'lock'} size={30} stroke={1.7} />
      </span>
      <div className="notice__text">
        <strong>{titulo}</strong>
        {texto && <p>{texto}</p>}
      </div>
    </div>
  );
}
