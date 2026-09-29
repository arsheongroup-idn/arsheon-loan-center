import { FLOW, STATUS_LABELS } from '../utils/constants.js';

// Renders the request lifecycle. `descriptions` is an optional { STATUS: text } map.
export default function StatusTimeline({ status, descriptions = {} }) {
  const rejected = status === 'REJECTED';
  const steps = rejected ? ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] : FLOW;
  const idx = steps.indexOf(status);

  return (
    <ol className="timeline" aria-label="Request progress">
      {steps.map((s, i) => {
        let cls = 'todo';
        if (s === 'REJECTED') cls = 'rejected';
        else if (i < idx) cls = 'done';
        else if (i === idx) cls = 'current';
        return (
          <li key={s} className={cls} aria-current={i === idx ? 'step' : undefined}>
            <span className="dot" aria-hidden="true">{cls === 'done' ? '✓' : s === 'REJECTED' ? '×' : i + 1}</span>
            <div>
              <strong>{STATUS_LABELS[s].toUpperCase()}</strong>
              {descriptions[s] && <span className="small muted">{descriptions[s]}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
