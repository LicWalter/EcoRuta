export default function ConductorDetalle({ conductor, onCerrar }) {
  if (!conductor) return null;

  return (
    <div>
      <h3>Detalle del conductor</h3>
      <ul>
        <li><strong>Nombre:</strong> {conductor.nombre}</li>
        <li><strong>Documento:</strong> {conductor.documento}</li>
        <li><strong>Teléfono:</strong> {conductor.telefono || 'No registrado'}</li>
        <li><strong>Categoría de licencia:</strong> {conductor.categoria_licencia}</li>
        <li><strong>Vencimiento de licencia:</strong> {conductor.vencimiento_licencia?.slice(0, 10)}</li>
        <li><strong>Estado:</strong> {conductor.estado}</li>
      </ul>
      <button type="button" onClick={onCerrar}>Cerrar detalle</button>
    </div>
  );
}