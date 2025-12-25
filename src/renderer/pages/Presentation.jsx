import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { Play, Square, PieChart, Users, Clock, List, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export default function Presentation() {
  const { proyecto } = useProject();
  
  // --- CONFIGURACIÓN DE LA VOTACIÓN ---
  const [pregunta, setPregunta] = useState("");
  const [modoVoto, setModoVoto] = useState("SIMPLE"); // 'SIMPLE' (1 voto) o 'COEFICIENTE'
  const [tipoPregunta, setTipoPregunta] = useState("SI_NO"); // 'SI_NO' o 'MULTIPLE'
  const [numOpciones, setNumOpciones] = useState(4); // Para múltiple (A, B, C, D...)
  const [tiempoLimite, setTiempoLimite] = useState(30); // Segundos por defecto
  
  // --- ESTADO EN VIVO ---
  const [votando, setVotando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(30);
  const [totalVotos, setTotalVotos] = useState(0);
  const [idsYaVotaron, setIdsYaVotaron] = useState(new Set());
  
  // Resultados dinámicos (Usamos un objeto mapa para flexibilidad)
  const [conteo, setConteo] = useState({}); 

  // --- COLORES ---
  const COLORS_SINO = { 'SI': '#10b981', 'NO': '#ef4444', 'ABS': '#f59e0b' };
  const COLORS_MULTI = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1']; // A, B, C, D, E, F

  // --- 1. LÓGICA DEL TEMPORIZADOR ---
  useEffect(() => {
    let intervalo = null;
    if (votando && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => prev - 1);
      }, 1000);
    } else if (tiempoRestante === 0 && votando) {
      detenerVotacion(); // ¡Tiempo agotado!
    }
    return () => clearInterval(intervalo);
  }, [votando, tiempoRestante]);

  // --- 2. ESCUCHAR HARDWARE ---
  useEffect(() => {
    const removeListener = window.electronAPI.onDatoSerial((data) => {
      if (!votando) return;

      // Evitar doble voto
      if (idsYaVotaron.has(data.id)) return;

      // Calcular valor del voto
      let valor = 1;
      if (modoVoto === 'COEFICIENTE') {
        const usuario = proyecto.padron.find(p => p.id === data.id);
        valor = usuario ? parseFloat(usuario.coeficiente) : 0;
      }

      // Interpretar qué votó el usuario (1, 2, 3...)
      let opcionVotada = null;

      if (tipoPregunta === 'SI_NO') {
        // Mapeo fijo: 1=SI, 2=NO, 3=ABS
        if (data.voto === 1) opcionVotada = 'SI';
        else if (data.voto === 2) opcionVotada = 'NO';
        else if (data.voto === 3) opcionVotada = 'ABS';
      } else {
        // Mapeo dinámico: 1=A, 2=B... según numOpciones
        // data.voto viene como número (1, 2, 3...)
        const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
        // Si votó 1 es A (índice 0), si votó 2 es B (índice 1)
        const indice = data.voto - 1; 
        
        if (indice >= 0 && indice < numOpciones) {
          opcionVotada = letras[indice];
        }
      }

      if (opcionVotada) {
        setConteo(prev => ({
          ...prev,
          [opcionVotada]: (prev[opcionVotada] || 0) + valor
        }));
        setIdsYaVotaron(prev => new Set(prev).add(data.id));
        setTotalVotos(prev => prev + 1);
      }
    });

    return () => { if(removeListener) removeListener(); };
  }, [votando, idsYaVotaron, modoVoto, tipoPregunta, numOpciones, proyecto.padron]);


  // --- MANEJADORES ---
  const iniciarVotacion = () => {
    if (!pregunta) return alert("Escribe una pregunta primero");
    
    // Inicializar contadores en 0 según el tipo
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
    setTiempoRestante(tiempoLimite); // Reset cronómetro
    setVotando(true);
  };

  const detenerVotacion = () => setVotando(false);

  // Preparar datos para Recharts (Convertir objeto a array)
  const datosGrafica = Object.keys(conteo).map((key, index) => ({
    name: key,
    valor: conteo[key],
    fill: tipoPregunta === 'SI_NO' ? COLORS_SINO[key] : COLORS_MULTI[index % COLORS_MULTI.length]
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: '100%' }}>
      
      {/* --- PANEL DE CONTROL (IZQUIERDA) --- */}
      <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configurar Votación</h2>
        
        {/* 1. Pregunta */}
        <div>
          <span className="label-title">Pregunta</span>
          <textarea 
            className="input-modern" 
            rows="2" 
            placeholder="Escribe aquí tu pregunta..."
            value={pregunta} 
            onChange={(e) => {
              console.log("Escribiendo:", e.target.value); // Debug en consola
              setPregunta(e.target.value);
            }}
            // Solo se bloquea si se está votando. Si quieres probar, borra la línea de abajo temporalmente:
            disabled={votando} 
            style={{ 
              resize: 'none', 
              position: 'relative', 
              zIndex: 10, 
              background: votando ? '#e2e8f0' : 'white' // Visualmente claro si está bloqueado
            }}
          />
        </div>

        {/* 2. Tipo de Respuesta */}
        <div>
          <span className="label-title">Tipo de Respuesta</span>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <button 
              onClick={() => setTipoPregunta('SI_NO')}
              className={tipoPregunta === 'SI_NO' ? 'btn-primary' : 'card'}
              style={{ flex: 1, padding: '8px', fontSize: '14px', justifyContent: 'center', border: '1px solid #ddd' }}
              disabled={votando}
            >
              <CheckCircle size={16} /> SI/NO
            </button>
            <button 
              onClick={() => setTipoPregunta('MULTIPLE')}
              className={tipoPregunta === 'MULTIPLE' ? 'btn-primary' : 'card'}
              style={{ flex: 1, padding: '8px', fontSize: '14px', justifyContent: 'center', border: '1px solid #ddd' }}
              disabled={votando}
            >
              <List size={16} /> Múltiple
            </button>
          </div>

          {tipoPregunta === 'MULTIPLE' && (
             <div className="animate-fade-in">
               <label style={{fontSize: '14px'}}>Opciones (Máx 6):</label>
               <input 
                 type="number" min="2" max="6" 
                 className="input-modern" 
                 value={numOpciones} onChange={e => setNumOpciones(parseInt(e.target.value))}
                 disabled={votando}
               />
               <small style={{display:'block', color:'#666', marginTop:'4px'}}>Opciones de la A a la {String.fromCharCode(64 + numOpciones)}</small>
             </div>
          )}
        </div>

        {/* 3. Temporizador */}
        <div>
          <span className="label-title">Tiempo (Segundos)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#64748b" />
            <input 
              type="number" 
              className="input-modern" 
              value={tiempoLimite} onChange={(e) => setTiempoLimite(parseInt(e.target.value))}
              disabled={votando}
            />
          </div>
        </div>

        {/* 4. Modo Voto */}
        <div>
          <span className="label-title">Valor del Voto</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => setModoVoto('SIMPLE')}
              className={modoVoto === 'SIMPLE' ? 'btn-primary' : 'card'}
              style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center', border: '1px solid #ddd' }} disabled={votando}
            >
              <Users size={14} /> 1x1
            </button>
            <button 
              onClick={() => setModoVoto('COEFICIENTE')}
              className={modoVoto === 'COEFICIENTE' ? 'btn-primary' : 'card'}
              style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center', border: '1px solid #ddd' }} disabled={votando}
            >
              <PieChart size={14} /> Coef.
            </button>
          </div>
        </div>

        {/* BOTÓN ACCIÓN */}
        <div style={{ marginTop: 'auto' }}>
          {!votando ? (
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#16a34a' }} onClick={iniciarVotacion}>
              <Play size={20} /> INICIAR
            </button>
          ) : (
            <button className="btn-danger animate-pulse" style={{ width: '100%', justifyContent: 'center' }} onClick={detenerVotacion}>
              <Square size={20} /> DETENER
            </button>
          )}
        </div>
      </div>

      {/* --- PANEL VISUALIZACIÓN (DERECHA) --- */}
      <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        
        {/* RELOJ GIGANTE */}
        {votando && (
          <div style={{ position: 'absolute', top: 20, right: 20, fontSize: '2rem', fontWeight: 'bold', color: tiempoRestante < 10 ? '#ef4444' : '#64748b' }}>
            {tiempoRestante}s
          </div>
        )}

        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '10px', maxWidth: '80%' }}>
          {pregunta || "Preparando votación..."}
        </h1>
        
        <div style={{ width: '100%', height: '450px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafica} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 24, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]} animationDuration={500}>
                {
                  datosGrafica.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))
                }
                <LabelList dataKey="valor" position="top" style={{ fontSize: '20px', fontWeight: 'bold', fill: '#666' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: '20px', color: '#94a3b8', fontSize: '1.2rem' }}>
          Total Votos Recibidos: <strong>{totalVotos}</strong>
        </div>

      </div>

    </div>
  );
}