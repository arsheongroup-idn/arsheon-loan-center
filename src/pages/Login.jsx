import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toFriendlyError } from '../utils/errors.js';

export default function Login() {
  const { loading, user, isAdmin, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  if (!loading && user && isAdmin) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (lock.current) return;
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card stack login-card slide-in" onSubmit={onSubmit} noValidate>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span><strong>ARSHEON LOAN CENTER</strong><small>Authorized administrators only</small></span>
        </div>
        <h1 className="h-md">Sign in</h1>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} disabled={busy} />
        </div>
        {user && !isAdmin && !loading && (
          <div className="alert error" role="alert">
            This account is not authorized.{' '}
            <button type="button" className="link-btn" onClick={logout}>Sign out</button>
          </div>
        )}
        {error && <div className="alert error" role="alert">{error}</div>}
        <button className="btn block" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
