import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AcceptFlow from '../components/AcceptFlow.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { changeStatus, saveNotes, watchAudit, watchNotes, watchRequest } from '../services/adminService.js';
import { STATUS_LABELS, TRANSITIONS } from '../utils/constants.js';
import { toFriendlyError } from '../utils/errors.js';
import { formatDate, formatIDR } from '../utils/format.js';

export default function RequestDetail() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const [req, setReq] = useState(undefined); // undefined = loading, null = not found
  const [loadError, setLoadError] = useState('');
  const [audit, setAudit] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesBusy, setNotesBusy] = useState(false);
  const [notesMsg, setNotesMsg] = useState('');
  const [modal, setModal] = useState(null); // 'accept' | 'reject' | { advance: STATUS }
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const lastSaved = useRef('');
  const lock = useRef(false);

  useEffect(() => {
    setReq(undefined);
    setLoadError('');
    const onErr = (err) => setLoadError(toFriendlyError(err));
    const stops = [
      watchRequest(requestId, setReq, onErr),
      watchAudit(requestId, setAudit, onErr),
      watchNotes(
        requestId,
        (v) => { setNotes((cur) => (cur === lastSaved.current ? v : cur)); lastSaved.current = v; },
        onErr
      ),
    ];
    return () => stops.forEach((s) => s());
  }, [requestId]);

  async function run(to) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setActionError('');
    try {
      await changeStatus(req, to, user.uid);
      setModal(null);
      setMessage(`Status changed to ${STATUS_LABELS[to]}.`);
    } catch (err) {
      setActionError(toFriendlyError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function onSaveNotes() {
    setNotesBusy(true);
    setNotesMsg('');
    try {
      await saveNotes(requestId, user.uid, notes);
      lastSaved.current = notes;
      setNotesMsg('Notes saved.');
    } catch (err) {
      setNotesMsg(toFriendlyError(err));
    } finally {
      setNotesBusy(false);
    }
  }

  if (req === undefined && !loadError) {
    return <div className="skeleton" style={{ height: 300 }} aria-busy="true" aria-label="Loading request..." />;
  }
  if (loadError) return <div className="alert error" role="alert">{loadError}</div>;
  if (req === null) {
    return (
      <div className="card stack">
        <h1 className="h-md">Request not found</h1>
        <p className="muted">No request exists with ID {requestId}.</p>
        <Link className="btn" to="/requests">Back to requests</Link>
      </div>
    );
  }

  const next = TRANSITIONS[req.status] ?? [];
  const rows = [
    ['Request ID', <span className="mono">{req.requestId}</span>],
    ['Full Name', req.borrowerName],
    ['Business Name', req.businessName],
    ['Phone', req.phone],
    ['Email', req.email],
    ['Requested Amount', formatIDR(req.requestedAmount)],
    ['Funding Purpose', req.purpose],
    ['Business Description', <span className="pre">{req.businessDescription}</span>],
    ['Funding Plan', <span className="pre">{req.fundingPlan}</span>],
    ['Additional Notes', <span className="pre">{req.additionalNotes || '-'}</span>],
    ['Created At', formatDate(req.createdAt, 'en-GB', true)],
    ['Updated At', formatDate(req.updatedAt, 'en-GB', true)],
    ['Status', <StatusBadge status={req.status} />],
  ];

  return (
    <>
      <Link to="/requests" className="small back">‹ All requests</Link>
      <div className="row between" style={{ margin: '0.5rem 0 1.5rem' }}>
        <h1 className="h-md mono" style={{ margin: 0 }}>{req.requestId}</h1>
        <StatusBadge status={req.status} />
      </div>

      {message && <div className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{message}</div>}

      <div className="detail-grid">
        <div className="stack">
          <dl className="card details">
            {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>

          <div className="card stack">
            <h3>Internal notes</h3>
            <p className="small muted">Admin-only. Never shown to the requestor.</p>
            <label className="sr-only" htmlFor="notes">Internal notes</label>
            <textarea id="notes" className="textarea" maxLength={4000} value={notes} onChange={(e) => { setNotes(e.target.value); setNotesMsg(''); }} />
            <div className="row">
              <button type="button" className="btn small" onClick={onSaveNotes} disabled={notesBusy || notes === lastSaved.current} aria-busy={notesBusy}>
                {notesBusy ? 'Saving...' : 'Save notes'}
              </button>
              {notesMsg && <span className="small muted" role="status">{notesMsg}</span>}
            </div>
          </div>

          <div className="card">
            <h3>Audit history</h3>
            {audit.length === 0 ? <p className="small muted">No admin actions recorded yet.</p> : (
              <ul className="audit">
                {audit.map((a, i) => (
                  <li key={`${a.timestamp}-${i}`}>
                    <strong>{a.action}</strong>
                    {a.previousStatus && <span className="muted"> {a.previousStatus} → {a.newStatus}</span>}
                    <span className="small muted block">{formatDate(a.timestamp, 'en-GB', true)} · admin {String(a.adminId).slice(0, 6)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3>Actions</h3>
            {next.length === 0 ? (
              <p className="small muted">This request is {STATUS_LABELS[req.status]}. No further actions are available.</p>
            ) : req.status === 'UNDER_REVIEW' ? (
              <div className="stack">
                <button type="button" className="btn block" onClick={() => { setActionError(''); setModal('accept'); }}>ACCEPT REQUEST</button>
                <button type="button" className="btn danger block" onClick={() => { setActionError(''); setModal('reject'); }}>REJECT REQUEST</button>
              </div>
            ) : (
              <div className="stack">
                {next.map((to) => (
                  <button key={to} type="button" className="btn block" onClick={() => { setActionError(''); setModal({ advance: to }); }}>
                    {to === 'UNDER_REVIEW' ? 'Start review' : `Move to ${STATUS_LABELS[to]}`}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3>Progress</h3>
            <StatusTimeline status={req.status} />
          </div>
        </aside>
      </div>

      {modal === 'accept' && (
        <AcceptFlow request={req} adminUid={user.uid}
          onClose={(done) => { setModal(null); if (done) setMessage('Status changed to Accepted.'); }} />
      )}

      {modal === 'reject' && (
        <Modal title="Reject this request?" onClose={() => setModal(null)} busy={busy}>
          <p>This marks <strong>{req.requestId}</strong> as Rejected. The requestor will see the new status and it cannot be reversed.</p>
          {actionError && <div className="alert error" role="alert">{actionError}</div>}
          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn danger" onClick={() => run('REJECTED')} disabled={busy} aria-busy={busy}>{busy ? 'Processing...' : 'Reject request'}</button>
          </div>
        </Modal>
      )}

      {modal && modal.advance && (
        <Modal title="Change status?" onClose={() => setModal(null)} busy={busy}>
          <p>Change <strong>{req.requestId}</strong> from <strong>{STATUS_LABELS[req.status]}</strong> to <strong>{STATUS_LABELS[modal.advance]}</strong>? The requestor will see this update.</p>
          {actionError && <div className="alert error" role="alert">{actionError}</div>}
          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn" onClick={() => run(modal.advance)} disabled={busy} aria-busy={busy}>{busy ? 'Processing...' : 'Confirm'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
