import { useEffect, useState } from 'react';

const ESTADO_INICIAL = {
  nombre: '',
  documento: '',
  telefono: '',
  categoria_licencia: 'C2',
  vencimiento_licencia: '',
  estado: 'activo',
};

export default function ConductorForm({
  conductorInicial = null,
  onSubmit,
  onCancel,
  guardando = false,
  errorServidor = '',
}) {
  const [form, setForm] = useState(ESTADO_INICIAL);

  useEffect(() => {
    if (conductorInicial) {
      setForm({
        nombre: conductorInicial.nombre || '',
        documento: conductorInicial.documento || '',
        telefono: conductorInicial.telefono || '',
        categoria_licencia: conductorInicial.categoria_licencia || 'C2',
        vencimiento_licencia: conductorInicial.vencimiento_licencia
          ? conductorInicial.vencimiento_licencia.slice(0, 10)
          : '',
        estado: conductorInicial.estado || 'activo',
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
  }, [conductorInicial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{conductorInicial ? 'Editar conductor' : 'Registrar nuevo conductor'}</h3>
      {errorServidor && <div role="alert">{errorServidor}</div>}

      <label htmlFor="nombre">Nombre completo *</label>
      <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} required />

      <label htmlFor="documento">Documento *</label>
      <input id="documento" name="documento" type="text" value={form.documento} onChange={handleChange} required />

      <label htmlFor="telefono">Teléfono</label>
      <input id="telefono" name="telefono" type="text" value={form.telefono} onChange={handleChange} />

      <label htmlFor="categoria_licencia">Categoría de licencia *</label>
      <select id="categoria_licencia" name="categoria_licencia" value={form.categoria_licencia} onChange={handleChange} required>
        <option value="C1">C1</option>
        <option value="C2">C2</option>
        <option value="C3">C3</option>
        <option value="B1">B1</option>
        <option value="B2">B2</option>
      </select>

      <label htmlFor="vencimiento_licencia">Vencimiento de licencia *</label>
      <input id="vencimiento_licencia" name="vencimiento_licencia" type="date" value={form.vencimiento_licencia} onChange={handleChange} required />

      <label htmlFor="estado">Estado *</label>
      <select id="estado" name="estado" value={form.estado} onChange={handleChange}>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

      <div>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : conductorInicial ? 'Actualizar' : 'Registrar'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={guardando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}