import { Link } from 'react-router-dom';
import RequestsTable from '../components/RequestsTable.jsx';
import useRequests from '../services/useRequests.js';

const CARDS = [
  ['TOTAL REQUESTS', null],
  ['PENDING', 'SUBMITTED'],
  ['UNDER REVIEW', 'UNDER_REVIEW'],
  ['ACCEPTED', 'ACCEPTED'],
  ['REJECTED', 'REJECTED'],
  ['CONTACT REQUIRED', 'CONTACT_REQUIRED'],
  ['AGREEMENT', 'AGREEMENT'],
  ['FUNDED', 'FUNDED'],
  ['ACTIVE', 'ACTIVE'],
  ['COMPLETED', 'COMPLETED'],
];

export default function Dashboard() {
  const { loading, error, items } = useRequests();
  const count = (status) => (status ? items.filter((r) => r.status === status).length : items.length);

  return (
    <>
      <h1 className="h-md">Dashboard</h1>
      {error && <div className="alert error" role="alert">{error}</div>}

      <section aria-label="Request totals" className="stats">
        {CARDS.map(([label, status]) => (
          <div className="card stat" key={label}>
            <span className="small muted">{label}</span>
            {loading ? <div className="skeleton" style={{ height: 32, width: 48 }} /> : <strong>{count(status)}</strong>}
          </div>
        ))}
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <div className="row between" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Recent requests</h2>
          <Link className="btn secondary small" to="/requests">View all</Link>
        </div>
        {loading ? <div className="skeleton" style={{ height: 160 }} aria-busy="true" /> : <RequestsTable items={items.slice(0, 5)} empty="No requests have been submitted yet." />}
      </section>
    </>
  );
}
