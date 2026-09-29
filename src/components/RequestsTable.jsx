import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatIDR } from '../utils/format.js';

export default function RequestsTable({ items, empty = 'No requests found.' }) {
  if (!items.length) return <div className="card flat muted">{empty}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Request ID</th><th scope="col">Borrower</th><th scope="col">Business</th>
            <th scope="col">Amount</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.requestId}>
              <td className="mono">{r.requestId}</td>
              <td>{r.borrowerName}</td>
              <td>{r.businessName}</td>
              <td>{formatIDR(r.requestedAmount)}</td>
              <td>{formatDate(r.createdAt, 'en-GB')}</td>
              <td><StatusBadge status={r.status} /></td>
              <td><Link className="btn secondary small" to={`/requests/${r.requestId}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
