import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Server, LogOut, LayoutDashboard } from 'lucide-react';

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Servers', path: '/servers', icon: <Server size={18} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Terminal color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Web SSH</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button 
            onClick={handleLogout} 
            className="nav-item" 
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ color: 'var(--text-secondary)' }}>
            Welcome back to the control plane.
          </div>
        </header>
        
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
