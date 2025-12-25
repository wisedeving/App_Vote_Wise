import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';

// Importar Páginas (Aún vacías, créalas abajo)
import HomePage from './pages/Home';
import SetupPage from './pages/Setup';
import PresentationPage from './pages/Presentation';
import ReportsPage from './pages/Reports';

export default function App() {
  return (
    <ProjectProvider> {/* El contexto envuelve todo */}
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/presentation" element={<PresentationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ProjectProvider>
  );
}