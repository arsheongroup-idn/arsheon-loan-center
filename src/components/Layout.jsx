import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand" aria-label="Arsheon Loan Center — dashboard">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span><strong>ARSHEON LOAN CENTER</strong><small>Internal administration</small></span>
          </Link>
          <nav aria-label="Main" className="row">
            <NavLink to="/" end className="nav-link">Dashboard</NavLink>
            <NavLink to="/requests" className="nav-link">Requests</NavLink>
            <span className="small muted user-email">{user?.email}</span>
            <button type="button" className="btn secondary small" onClick={logout}>Sign out</button>
          </nav>
        </div>
      </header>
      <main id="main" className="container page fade-in">
        <Outlet />
      </main>
    </>
  );
}
