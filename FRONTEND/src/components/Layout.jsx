import { NavLink, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/marcaciones', label: 'Marcaciones', icon: 'bi-clock-history' },
  { to: '/trabajadores', label: 'Trabajadores', icon: 'bi-people' },
];

const titles = {
  '/': 'Panel de Analíticas',
  '/marcaciones': 'Gestión de Marcaciones',
  '/trabajadores': 'Gestión de Trabajadores',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="tt-layout">
      <aside className="tt-sidebar">
        <div className="tt-brand">
          <i className="bi bi-clock-fill" style={{ color: 'var(--tt-accent)' }}></i>
          Time-Taker
        </div>
        <nav className="nav flex-column mt-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              <i className={`bi ${l.icon}`}></i>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-3 small" style={{ color: 'var(--tt-text-muted)' }}>
          <div>Time-Taker v1.0</div>
          <div>Marcación de tiempos</div>
        </div>
      </aside>

      <div className="tt-main">
        <header className="tt-topbar d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-semibold">{titles[pathname] ?? 'Time-Taker'}</h5>
          <span className="text-muted small">
            <i className="bi bi-calendar3 me-1"></i>
            {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>
        <main className="tt-content">{children}</main>
      </div>
    </div>
  );
}
