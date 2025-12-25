import React, { useState } from 'react'; // Eliminamos useEffect si no escaneamos manual
import { useProject } from '../context/ProjectContext';
import { Save, Trash2, Upload, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse'; // Importamos el lector CSV

export default function Setup() {
  const { proyecto, setProyecto } = useProject();

  // Función para leer el archivo CSV/Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // Asume que la primera fila son títulos
      skipEmptyLines: true,
      complete: (results) => {
        // results.data será un array: [{id: "1", nombre: "Juan", coeficiente: "1.5"}, ...]
        
        const nuevosUsuarios = results.data.map(fila => ({
          id: parseInt(fila.id), // Aseguramos que sea número
          nombre: fila.nombre || `Control ${fila.id}`,
          coeficiente: parseFloat(fila.coeficiente) || 1.0,
          registrado: true
        }));

        setProyecto(prev => ({
          ...prev,
          padron: [...prev.padron, ...nuevosUsuarios]
        }));
        
        alert(`¡Se importaron ${nuevosUsuarios.length} controles exitosamente!`);
      },
      error: (err) => {
        alert("Error leyendo archivo: " + err.message);
      }
    });
  };

  const limpiarPadron = () => {
    if(confirm("¿Borrar toda la lista?")) {
      setProyecto(prev => ({ ...prev, padron: [] }));
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>⚙️ Gestión Masiva de Controles</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* BOTÓN INPUT INVISIBLE PARA CARGAR ARCHIVO */}
          <label className="btn-primary" style={{ cursor: 'pointer', background: '#2563eb' }}>
            <Upload size={18} /> Importar CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>

          <button onClick={limpiarPadron} className="btn-danger">
            <Trash2 size={18} /> Limpiar Todo
          </button>
        </div>
      </div>

      {/* ZONA DE INSTRUCCIONES */}
      <div className="card" style={{ marginBottom: '20px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
        <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSpreadsheet color="#d97706"/> Formato del Archivo CSV
        </h3>
        <p style={{ margin: 0, color: '#92400e' }}>
          Crea un Excel con estas 3 columnas y guárdalo como <strong>.csv</strong>:<br/>
          <code>id, nombre, coeficiente</code><br/>
          Ejemplo: <code>1, Apto 101, 1.55</code>
        </p>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="card" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ID Control</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Nombre Asignado</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Coeficiente</th>
            </tr>
          </thead>
          <tbody>
            {proyecto.padron.map((u, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 'bold', color: '#6366f1' }}>
                  #{u.id}
                </td>
                <td style={{ padding: '12px 15px' }}>{u.nombre}</td>
                <td style={{ padding: '12px 15px' }}>{u.coeficiente}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {proyecto.padron.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No hay datos. Importa un archivo CSV para comenzar.
          </div>
        )}
      </div>

    </div>
  );
}