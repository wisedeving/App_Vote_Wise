import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { Play, Square, PieChart, Users, Clock, List, CheckCircle, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export default function Presentation() {
  const { proyecto, guardarVotacionEnHistorial } = useProject();
  
  // --- CONFIGURACIÓN ---
  const [pregunta, setPregunta] = useState("");
  const [modoVoto, setModoVoto] = useState("SIMPLE"); // SIMPLE (1x1) o COEFICIENTE
  const [tipoPregunta, setTipoPregunta] = useState("SI_NO");
  const [numOpciones, setNumOpciones] = useState(4);
  const [tiempoLimite, setTiempoLimite] = useState(30);
  
  // --- ESTADO EN VIVO ---
  const [votando, setVotando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(30);
  const [totalVotos, setTotalVotos] = useState(0); // Suma de conteos (pueden ser coeficientes)
  
  // Control de IDs para no repetir votos
  const [idsYaVotaron, setIdsYaVotaron] = useState(new Set());
  
  // NUEVO: Almacena el detalle completo para el reporte (Excel)
  const [votosDetallados, setVotosDetallados] = useState([]);

  // Resultados agregados
  const [conteo, setConteo] = useState({}); 

  const COLORS_SINO = { 'SI': '#10b981', 'NO': '#ef4444', 'ABS': '#f59e0b' };
  const COLORS_MULTI = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

  // --- TEMPORIZADOR ---
  useEffect(() => {
    let intervalo = null;
    if (votando && tiempoRestante > 0) {
      intervalo = setInterval(() => setTiempoRestante(t => t - 1), 1000);
    } else if (tiempoRestante === 0 && votando) {
      detenerVotacion();
    }
    return () => clearInterval(intervalo);
  }, [votando, tiempoRestante]);

  // --- ESCUCHAR HARDWARE (Votos) ---
  useEffect(() => {
    const removeListener = window.electronAPI.onDatoSerial((data) => {
      if (!votando) return;
      if (idsYaVotaron.has(data.id)) return; // Ya votó este control

      // Buscar usuario en el padrón
      const usuario = proyecto.padron.find(p => p.id === data.id);
      
      // Determinar valor del voto
      let valor = 1;
      if (modoVoto === 'COEFICIENTE') {
        valor = usuario ? parseFloat(usuario.coeficiente) : 0;
      }

      // Determinar qué opción eligió
      let opcionVotada = null;
      if (tipoPregunta === 'SI_NO') {
        if (data.voto === 1) opcionVotada = 'SI';
        else if (data.voto === 2) opcionVotada = 'NO';
        else if (data.voto === 3) opcionVotada = 'ABS';
      } else {
        const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
        const indice = data.voto - 1; 
        if (indice >= 0 && indice < numOpciones) {
          opcionVotada = letras[indice];
        }
      }

      if (opcionVotada) {
        // 1. Actualizar conteo general (Gráfica)
        setConteo(prev => ({
          ...prev,
          [opcionVotada]: (prev[opcionVotada] || 0) + valor
        }));

        // 2. Marcar ID como usado
        setIdsYaVotaron(prev => new Set(prev).add(data.id));
        setTotalVotos(prev => prev + valor); // Sumamos valor (1 o coeficiente)

        // 3. GUARDAR DETALLE (Para Excel)
        setVotosDetallados(prev => [...prev, {
            id: data.id,
            nombre: usuario ? usuario.nombre : `Control ${data.id}`,
            opcion: opcionVotada, // <--- IMPORTANTE: AQUÍ GUARDAMOS QUÉ VOTÓ
            coeficiente: usuario ? usuario.coeficiente : 0,
            valor: valor
        }]);
      }
    });

    return () => { if(removeListener) removeListener(); };
  }, [votando, idsYaVotaron, modoVoto, tipoPregunta, numOpciones, proyecto.padron]);


  // --- MANEJADORES ---
  const iniciarVotacion = () => {
    if (!pregunta) return alert("Escribe una pregunta primero");
    if (proyecto.padron.length === 0) return alert("No hay controles cargados (Setup)");

    const inicial = {};
    if (tipoPregunta === 'SI_NO') {
      inicial['SI'] = 0; inicial['NO'] = 0; inicial['ABS'] = 0;
    } else {
      const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (let i = 0; i < numOpciones; i++) inicial[letras[i]] = 0;
    }

    setConteo(inicial);
    setTotalVotos(0);
    setIdsYaVotaron(new Set());
    setVotosDetallados([]); // Reiniciar detalle
    setTiempoRestante(tiempoLimite);
    setVotando(true);
  };

  const detenerVotacion = () => setVotando(false);

  // --- PREPARAR GRÁFICA (Visualización %) ---
  const datosGrafica = Object.keys(conteo).map((key, index) => {
    const valorRaw = conteo[key];
    // Calcular porcentaje para mostrar en la etiqueta
    // Si es coeficiente, totalVotos ya es la suma de coeficientes.
    // Si es 1x1, totalVotos es la cantidad de personas.
    const porcentaje = totalVotos > 0 ? ((valorRaw / totalVotos) * 100).toFixed(1) : "0.0";
    
    return {
      name: key,
      valor: valorRaw, // Recharts usa esto para la altura
      label: `${porcentaje}%`, // Etiqueta visual
      fill: tipoPregunta === 'SI_NO' ? COLORS_SINO[key] : COLORS_MULTI[index % COLORS_MULTI.length]
    };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: '100%' }}>
      
      {/* --- PANEL IZQUIERDO (CONFIG) --- */}
      <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configurar Votación</h2>
        
        {/* Pregunta */}
        <div>
          <span className="label-title">Pregunta</span>
          <textarea 
            className="input-modern" 
            rows="2" 
            placeholder="Escribe la pregunta..."
            value={pregunta} 
            onChange={(e) => setPregunta(e.target.value)}
            style={{ resize: 'none', position: 'relative', zIndex: 10, background: votando ? '#f1f5f9' : 'white' }}
          />
        </div>

        {/* Tipo Respuesta */}
        <div>
          <span className="label-title">Tipo de Respuesta</span>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <button 
              onClick={() => setTipoPregunta('SI_NO')}
              className={tipoPregunta === 'SI_NO' ? 'btn-primary' : 'card'}
              style={{ flex: 1, padding: '8px', justifyContent: 'center' }}
              disabled={votando}
            >
              <CheckCircle size={16} /> SI/NO
            </button>
            <button 
              onClick={() => setTipoPregunta('MULTIPLE')}
              className={tipoPregunta === 'MULTIPLE' ? 'btn-primary' : 'card'}
              style={{ flex: 1, padding: '8px', justifyContent: 'center' }}
              disabled={votando}
            >
              <List size={16} /> Opción Múltiple
            </button>
          </div>

          {tipoPregunta === 'MULTIPLE' && (
             <div className="animate-fade-in">
               <label style={{fontSize: '14px'}}>Opciones (2-6):</label>
               <input 
                 type="number" min="2" max="6" 
                 className="input-modern" 
                 value={numOpciones} onChange={e => setNumOpciones(parseInt(e.target.value))}
                 disabled={votando}
               />
             </div>
          )}
        </div>

        {/* Tiempo y Modo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
                <span className="label-title">Tiempo (s)</span>
                <input 
                  type="number" 
                  className="input-modern" 
                  value={tiempoLimite} onChange={(e) => setTiempoLimite(parseInt(e.target.value))}
                  disabled={votando}
                />
            </div>
            <div>
                <span className="label-title">Modo</span>
                <select 
                    className="input-modern" 
                    value={modoVoto} 
                    onChange={(e) => setModoVoto(e.target.value)}
                    disabled={votando}
                >
                    <option value="SIMPLE">1x1 (Unitario)</option>
                    <option value="COEFICIENTE">Coeficiente</option>
                </select>
            </div>
        </div>

        {/* Botones Acción */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!votando ? (
            <>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#16a34a' }} onClick={iniciarVotacion}>
                <Play size={20} /> {totalVotos > 0 ? 'REINICIAR' : 'INICIAR'}
              </button>

              {/* BOTÓN GUARDAR: Usa el estado votosDetallados */}
              {idsYaVotaron.size > 0 && (
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', background: '#2563eb' }} 
                  onClick={() => {
                    const datosSnapshot = {
                      pregunta,
                      tipoPregunta,
                      modoVoto,
                      totalVotos,
                      resultadosConteo: conteo,
                      detalleVotos: votosDetallados // <--- Pasamos el array detallado
                    };
                    
                    guardarVotacionEnHistorial(datosSnapshot);
                    
                    alert("✅ Votación guardada en Historial");
                    setPregunta("");
                    setConteo({});
                    setTotalVotos(0);
                    setIdsYaVotaron(new Set());
                    setVotosDetallados([]);
                  }}
                >
                  <Save size={20} /> GUARDAR RESULTADOS
                </button>
              )}
            </>
          ) : (
            <button className="btn-danger animate-pulse" style={{ width: '100%', justifyContent: 'center' }} onClick={detenerVotacion}>
              <Square size={20} /> DETENER
            </button>
          )}
        </div>
      </div>

      {/* --- PANEL DERECHO (VISUALIZACIÓN) --- */}
      <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        
        {votando && (
          <div style={{ position: 'absolute', top: 20, right: 20, fontSize: '2rem', fontWeight: 'bold', color: tiempoRestante < 10 ? '#ef4444' : '#64748b' }}>
            {tiempoRestante}s
          </div>
        )}

        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '10px', maxWidth: '90%' }}>
          {pregunta || "Esperando configuración..."}
        </h1>
        
        <div style={{ width: '100%', height: '400px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafica} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 20, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]} animationDuration={500}>
                {datosGrafica.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                {/* Mostramos el porcentaje arriba de la barra */}
                <LabelList dataKey="label" position="top" style={{ fontSize: '18px', fontWeight: 'bold', fill: '#475569' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: '20px', color: '#64748b', fontSize: '1.2rem' }}>
          {modoVoto === 'COEFICIENTE' ? 'Suma Coeficientes' : 'Votos Totales'}: <strong>{totalVotos.toFixed(modoVoto === 'COEFICIENTE' ? 4 : 0)}</strong>
        </div>

      </div>

    </div>
  );
}