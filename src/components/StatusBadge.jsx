import { STATUS_LABELS } from '../utils/constants.js';

export default function StatusBadge({ status }) {
  return <span className={`badge s-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
