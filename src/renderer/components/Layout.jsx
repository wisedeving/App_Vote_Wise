import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Settings, PlayCircle, FileText } from 'lucide-react'; // Iconos

const Layout = ({ children }) => {
  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Inicio' },
    { path: '/setup', icon: <Settings size={20} />, label: 'Configuración' },
    { path: '/presentation', icon: <PlayCircle size={20} />, label: 'Presentación' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Reportes' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f5f5f5' }}>
      
      {/* BARRA LATERAL */}
      <aside style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px' }}>
        <h2 style={{ marginBottom: '40px', textAlign: 'center' }}>WiSe Vote</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px', borderRadius: '8px', textDecoration: 'none',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? '#334155' : 'transparent'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL (Aquí cambian las páginas) */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  );
};

export default Layout;