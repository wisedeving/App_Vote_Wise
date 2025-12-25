import React from 'react';

export default function Setup() {
  return (
    <div>
      <h1>Configuración del Proyecto</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* PANEL IZQUIERDO: PADRÓN */}
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>📡 Vinculación de Controles</h3>
          <p>Aquí irá la tabla para escanear IDs y asignar nombres.</p>
          <button>Escanear Nuevo Control</button>
          {/* Aquí pondremos el componente DeviceList luego */}
        </div>

        {/* PANEL DERECHO: DIAPOSITIVAS */}
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>📝 Preguntas / Diapositivas</h3>
          <p>Lista de preguntas a votar.</p>
          <button>+ Agregar Pregunta</button>
        </div>

      </div>
    </div>
  );
}