export default function ConductoresTabla({ conductores, onVerDetalle, onEditar, onToggleEstado }) {
  if (!conductores.length) {
    return <p>No hay conductores registrados.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Documento</th>
          <th>Categoría</th>
          <th>Vencimiento licencia</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {conductores.map((c) => {
          const activo = c.estado === 'activo' || c.activo === true;
          return (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.documento}</td>
              <td>{c.categoria_licencia}</td>
              <td>{c.vencimiento_licencia ? c.vencimiento_licencia.slice(0, 10) : '-'}</td>
              <td>{activo ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button type="button" onClick={() => onVerDetalle(c.id)}>Detalle</button>
                <button type="button" onClick={() => onEditar(c)}>Editar</button>
                <button type="button" onClick={() => onToggleEstado(c)}>
                  {activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}