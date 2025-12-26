import React, { createContext, useState, useContext } from 'react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [proyecto, setProyecto] = useState({
    nombre: "Nueva Asamblea",
    padron: [],
    // 👇 ESTA ES LA LÍNEA QUE TE FALTA. Sin ella, la app explota en Reportes.
    historial: [] 
  });

  // Función para guardar una votación terminada
  const guardarVotacionEnHistorial = (datosVotacion) => {
    setProyecto(prev => ({
      ...prev,
      // Usamos el operador spread (...) para no perder lo anterior
      historial: [...(prev.historial || []), {
        id: Date.now(), // ID único basado en la hora
        timestamp: new Date().toLocaleString(),
        ...datosVotacion // Título, resultados, votos individuales, gráfica
      }]
    }));
  };

  return (
    <ProjectContext.Provider value={{
      proyecto,
      setProyecto,
      guardarVotacionEnHistorial // Exportamos la función
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);