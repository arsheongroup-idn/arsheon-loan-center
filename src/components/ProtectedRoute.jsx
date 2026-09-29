import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { loading, user, isAdmin, logout } = useAuth();

  if (loading) {
    return (
      <div className="narrow" style={{ padding: '4rem 0' }} aria-busy="true">
        <div className="skeleton" style={{ height: 28, width: '50%' }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="narrow" style={{ padding: '4rem 0' }}>
        <div className="card stack" role="alert">
          <h1 className="h-md">Access denied</h1>
          <p className="muted">This account is not authorized to use Arsheon Loan Center.</p>
          <button className="btn" type="button" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
