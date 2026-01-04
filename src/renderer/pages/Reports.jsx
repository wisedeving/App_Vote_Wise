import React, { useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { FileDown, PieChart, ChevronRight, BarChart3, ImageDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { proyecto } = useProject();
  const [seleccionada, setSeleccionada] = useState(null);

  // --- 1. LÓGICA DE EXPORTACIÓN A EXCEL ---
  const exportarExcel = () => {
    if (proyecto.historial.length === 0) return alert("No hay votaciones para exportar");

    const wb = XLSX.utils.book_new();

    // HOJA 1: RESUMEN GENERAL
    const resumenData = proyecto.historial.map(h => ({
      Fecha: h.timestamp,
      Pregunta: h.pregunta,
      Tipo: h.tipoPregunta,
      Total_Votos: h.totalVotos,
      ...h.resultadosConteo 
    }));
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // HOJA 2: DETALLE AUDITORÍA (Quién votó qué)
    let auditoriaData = [];
    proyecto.historial.forEach((h, index) => {
      h.detalleVotos.forEach(voto => {
        auditoriaData.push({
          Votacion_ID: index + 1,
          Pregunta: h.pregunta,
          ID_Control: voto.id,
          Nombre_Propietario: voto.nombre,
          // CAMBIO AQUÍ: Intentamos leer la opción elegida. 
          // Ajusta 'voto.opcion' si tu propiedad se llama diferente (ej: voto.respuesta)
          Voto_Registrado: voto.opcion || voto.valor || voto.respuesta || "Voto Registrado"
        });
      });
    });
    
    const wsAuditoria = XLSX.utils.json_to_sheet(auditoriaData);
    XLSX.utils.book_append_sheet(wb, wsAuditoria, "Auditoria Votos");

    XLSX.writeFile(wb, `Reporte_Asamblea_${Date.now()}.xlsx`);
  };

  // --- 2. LÓGICA PARA DESCARGAR GRÁFICA COMO IMAGEN ---
  const descargarGraficaImagen = useCallback(() => {
    const svg = document.querySelector(".recharts-surface");
    if (!svg) return alert("No se encontró la gráfica para exportar");

    // Serializar el SVG a string
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Obtener dimensiones del SVG original
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;

    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

    img.onload = () => {
      // Dibujar fondo blanco (para que no sea transparente)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Crear enlace de descarga
      const link = document.createElement("a");
      link.download = `Grafica_${seleccionada?.pregunta || 'votacion'}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  }, [seleccionada]);


  // Preparar datos para gráfica
  const datosGrafica = seleccionada 
    ? Object.keys(seleccionada.resultadosConteo).map(key => ({
        name: key,
        valor: seleccionada.resultadosConteo[key],
        fill: '#8884d8'
      }))
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: '100%', overflow: 'hidden' }}>
      
      {/* --- PANEL IZQUIERDO: LISTA --- */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Historial ({proyecto.historial.length})</h2>
          <button 
            onClick={exportarExcel}
            className="btn-primary" 
            style={{ width: '100%', marginTop: '10px', justifyContent: 'center', background: '#059669' }}
          >
            <FileDown size={18} /> Exportar Excel
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {proyecto.historial.length === 0 && <p style={{ padding: '20px', color: '#94a3b8' }}>Aún no has guardado ninguna votación.</p>}
          
          {proyecto.historial.map((item, idx) => (
            <div 
              key={item.id}
              onClick={() => setSeleccionada(item)}
              style={{ 
                padding: '15px', 
                borderBottom: '1px solid #f1f5f9', 
                cursor: 'pointer',
                background: seleccionada?.id === item.id ? '#eff6ff' : 'white',
                borderLeft: seleccionada?.id === item.id ? '4px solid #2563eb' : '4px solid transparent'
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b' }}>{item.timestamp}</div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {item.pregunta || `Votación #${idx + 1}`}
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{item.tipoPregunta}</span>
                <span style={{ color: '#6366f1' }}>{item.totalVotos} votos</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- PANEL DERECHO: DETALLE --- */}
      <div className="card" style={{ overflowY: 'auto' }}>
        {seleccionada ? (
          <div className="animate-fade-in">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <h1 style={{ marginTop: 0 }}>{seleccionada.pregunta}</h1>
                <button 
                    onClick={descargarGraficaImagen}
                    style={{ 
                        background: '#6366f1', color: 'white', border: 'none', 
                        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                >
                    <ImageDown size={16} /> Guardar Gráfica
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', color: '#64748b', marginBottom: '20px' }}>
              <span>📅 {seleccionada.timestamp}</span>
              <span>🗳️ Modo: {seleccionada.modoVoto}</span>
            </div>

            {/* GRÁFICA ESTÁTICA */}
            <div id="grafica-container" style={{ width: '100%', height: '300px', background: '#f8fafc', borderRadius: '10px', padding: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafica}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#6366f1">
                      <LabelList dataKey="valor" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* TABLA DE RESULTADOS RAW */}
            <h3 style={{ marginTop: '30px' }}>📋 Participantes en esta votación</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Nombre</th>
                  <th style={{ padding: '10px' }}>Voto</th>
                </tr>
              </thead>
              <tbody>
                {seleccionada.detalleVotos.map((v, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>{v.id}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{v.nombre}</td>
                    <td style={{ padding: '8px', color: '#16a34a' }}>
                        {/* MUESTRA EL VOTO REAL EN PANTALLA TAMBIÉN */}
                        {v.opcion || v.valor || "CONFIRMADO"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
            <BarChart3 size={64} />
            <p>Selecciona una votación del historial para ver los detalles.</p>
          </div>
        )}
      </div>

    </div>
  );
}