import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="narrow" style={{ padding: '4rem 0' }}>
      <h1 className="h-md">Page not found</h1>
      <p className="muted">The address you opened does not exist.</p>
      <Link to="/" className="btn">Back to dashboard</Link>
    </section>
  );
}
