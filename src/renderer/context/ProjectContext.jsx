import React, { createContext, useState, useContext } from 'react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  // 1. Datos del Proyecto
  const [proyecto, setProyecto] = useState({
    nombre: "Sin Título",
    padron: [], // Lista de Aptos/Usuarios vinculados
    diapositivas: [] // Lista de preguntas
  });

  // 2. Estado de la Votación Actual
  const [votacionEnCurso, setVotacionEnCurso] = useState(false);
  const [votosRecibidos, setVotosRecibidos] = useState([]);

  // Funciones Globales
  const agregarDiapositiva = (titulo) => {
    const nueva = {
      id: Date.now(),
      titulo,
      tipo: 'SI_NO',
      resultados: null
    };
    setProyecto(prev => ({ ...prev, diapositivas: [...prev.diapositivas, nueva] }));
  };

  const vincularControl = (idHardware, nombre) => {
    // Aquí iría la lógica para agregar a la lista 'padron'
    console.log(`Vinculando ID ${idHardware} a ${nombre}`);
  };

  return (
    <ProjectContext.Provider value={{
      proyecto,
      setProyecto,
      votacionEnCurso,
      setVotacionEnCurso,
      votosRecibidos,
      setVotosRecibidos,
      agregarDiapositiva,
      vincularControl
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);