import { useEffect, useState } from 'react';
import {
  listarConductores,
  obtenerConductor,
  crearConductor,
  actualizarConductor,
  cambiarEstadoConductor,
} from '../../../api/conductores';
import ConductoresTabla from './ConductoresTabla';
import ConductorForm from './ConductorForm';
import ConductorDetalle from './ConductorDetalle';

export default function ConductoresPage() {
  const [conductores, setConductores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [conductorEditando, setConductorEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [conductorDetalle, setConductorDetalle] = useState(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setErrorGeneral('');
      const lista = await listarConductores();
      setConductores(lista);
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        setCargando(true);
        setErrorGeneral('');
        const lista = await listarConductores();
        if (activo) {
          setConductores(lista);
        }
      } catch (err) {
        if (activo) {
          setErrorGeneral(err.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const abrirCrear = () => {
    setConductorEditando(null);
    setErrorForm('');
    setMostrarForm(true);
  };

  const abrirEditar = (conductor) => {
    setConductorEditando(conductor);
    setErrorForm('');
    setMostrarForm(true);
  };

  const handleGuardar = async (payload) => {
    try {
      setGuardando(true);
      setErrorForm('');
      if (conductorEditando) {
        await actualizarConductor(conductorEditando.id, payload);
      } else {
        await crearConductor(payload);
      }
      setMostrarForm(false);
      setConductorEditando(null);
      await cargarDatos();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleVerDetalle = async (id) => {
    try {
      setErrorGeneral('');
      const detalle = await obtenerConductor(id);
      setConductorDetalle(detalle);
    } catch (err) {
      setErrorGeneral(err.message);
    }
  };

  const handleToggleEstado = async (conductor) => {
    const nuevoEstado = conductor.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      setErrorGeneral('');
      await cambiarEstadoConductor(conductor.id, nuevoEstado);
      await cargarDatos();
    } catch (err) {
      setErrorGeneral(err.message);
    }
  };

  return (
    <section>
      <header>
        <h2>Gestión de Conductores</h2>
        <button type="button" onClick={abrirCrear}>+ Nuevo conductor</button>
      </header>

      {errorGeneral && <div role="alert">{errorGeneral}</div>}

      {mostrarForm && (
        <ConductorForm
          key={conductorEditando ? conductorEditando.id : 'nuevo'}
          conductorInicial={conductorEditando}
          onSubmit={handleGuardar}
          onCancel={() => {
            setMostrarForm(false);
            setConductorEditando(null);
          }}
          guardando={guardando}
          errorServidor={errorForm}
        />
      )}

      {cargando ? (
        <p>Cargando conductores...</p>
      ) : (
        <ConductoresTabla
          conductores={conductores}
          onVerDetalle={handleVerDetalle}
          onEditar={abrirEditar}
          onToggleEstado={handleToggleEstado}
        />
      )}

      <ConductorDetalle conductor={conductorDetalle} onCerrar={() => setConductorDetalle(null)} />
    </section>
  );
}