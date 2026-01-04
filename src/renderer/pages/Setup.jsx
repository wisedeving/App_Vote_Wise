import React from 'react';
import { useProject } from '../context/ProjectContext';
import { Trash2, Upload, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

export default function Setup() {
  const { proyecto, setProyecto } = useProject();

  // Función para leer el archivo CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // 1. Mapeo preliminar de datos
        const nuevosUsuarios = results.data.map(fila => ({
          id: parseInt(fila.id),
          nombre: fila.nombre || `Control ${fila.id}`,
          coeficiente: parseFloat(fila.coeficiente && fila.coeficiente.replace(',', '.')) || 0, // Soporte para comas o puntos
          registrado: true
        }));

        // --- VALIDACIÓN DE COEFICIENTES (SUMA 100%) ---
        // Sumamos todos los coeficientes importados
        const sumaTotal = nuevosUsuarios.reduce((acc, curr) => acc + curr.coeficiente, 0);
        
        // Permitimos un margen de error mínimo por decimales (ej: 99.9999)
        const margenError = 0.1; 
        const esValido = Math.abs(sumaTotal - 100.0) < margenError;

        if (!esValido) {
            alert(`⚠️ ERROR DE VALIDACIÓN:\n\nLa suma de los coeficientes es: ${sumaTotal.toFixed(4)}%\nDebe sumar exactamente 100%.\n\nPor favor corrige el archivo Excel y vuelve a intentarlo.`);
            e.target.value = null; // Limpiar input
            return; // DETIENE LA IMPORTACIÓN
        }
        // -----------------------------------------------

        setProyecto(prev => ({
          ...prev,
          padron: [...prev.padron, ...nuevosUsuarios]
        }));
        
        alert(`✅ Éxito: Se importaron ${nuevosUsuarios.length} controles. Suma Coeficientes: ${sumaTotal.toFixed(2)}%`);
      },
      error: (err) => {
        alert("Error leyendo archivo: " + err.message);
      }
    });
  };

  const limpiarPadron = () => {
    if(confirm("¿Estás seguro de borrar toda la base de datos de controles?")) {
      setProyecto(prev => ({ ...prev, padron: [] }));
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>⚙️ Gestión Masiva de Controles</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="btn-primary" style={{ cursor: 'pointer', background: '#2563eb' }}>
            <Upload size={18} /> Importar CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>

          <button onClick={limpiarPadron} className="btn-danger">
            <Trash2 size={18} /> Limpiar Todo
          </button>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="card" style={{ marginBottom: '20px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
        <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSpreadsheet color="#d97706"/> Reglas del Archivo
        </h3>
        <p style={{ margin: 0, color: '#92400e' }}>
          1. El archivo debe ser <strong>.csv</strong> (delimitado por comas).<br/>
          2. Columnas obligatorias: <code>id, nombre, coeficiente</code>.<br/>
          3. <strong>IMPORTANTE:</strong> La columna <code>coeficiente</code> debe sumar exactamente <strong>100</strong>.
        </p>
      </div>

      {/* Tabla */}
      <div className="card" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Nombre</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Coeficiente</th>
            </tr>
          </thead>
          <tbody>
            {proyecto.padron.map((u, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#6366f1' }}>#{u.id}</td>
                <td style={{ padding: '12px 15px' }}>{u.nombre}</td>
                <td style={{ padding: '12px 15px' }}>{Number(u.coeficiente).toFixed(4)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {proyecto.padron.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No hay datos cargados.
          </div>
        )}
      </div>
    </div>
  );
}