import React from 'react';
import { useProject } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { setProyecto } = useProject();
  const navigate = useNavigate();

  const crearNuevo = () => {
    setProyecto({ nombre: "Nueva Asamblea", padron: [], diapositivas: [] });
    navigate('/setup');
  };

  return (
    <div>
      <h1>Bienvenido a WiSe</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
        <button onClick={crearNuevo} style={{ padding: '20px', fontSize: '18px', cursor: 'pointer' }}>
          ➕ Crear Nuevo Proyecto
        </button>
        <button style={{ padding: '20px', fontSize: '18px', cursor: 'pointer' }}>
          📂 Abrir Proyecto
        </button>
      </div>
    </div>
  );
}