import { useMemo, useState } from 'react';
import RequestsTable from '../components/RequestsTable.jsx';
import useRequests from '../services/useRequests.js';
import { ALL_STATUSES, STATUS_LABELS } from '../utils/constants.js';

export default function Requests() {
  const { loading, error, items } = useRequests();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (r) =>
        (filter === 'ALL' || r.status === filter) &&
        (!q ||
          r.requestId.toLowerCase().includes(q) ||
          r.borrowerName.toLowerCase().includes(q) ||
          r.businessName.toLowerCase().includes(q))
    );
  }, [items, search, filter]);

  return (
    <>
      <h1 className="h-md">Requests</h1>
      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="search">Search</label>
          <input id="search" className="input" type="search" placeholder="Request ID, name, or business name"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="filter">Status</label>
          <select id="filter" className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <p className="small muted" aria-live="polite">{loading ? 'Loading requests...' : `${shown.length} of ${items.length} requests`}</p>
      {loading ? <div className="skeleton" style={{ height: 220 }} aria-busy="true" /> : <RequestsTable items={shown} empty="No requests match your search or filter." />}
    </>
  );
}
