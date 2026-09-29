import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import { changeStatus, clearChallenge, createChallenge, verifyChallenge } from '../services/adminService.js';
import { toFriendlyError } from '../utils/errors.js';

// Two-step acceptance: (1) confirm intent, (2) type a short-lived code, then CONFIRM ACCEPTANCE.
export default function AcceptFlow({ request, adminUid, onClose }) {
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const deadline = useRef(0);
  const lock = useRef(false);

  useEffect(() => {
    if (step !== 2) return undefined;
    const t = setInterval(() => setSecondsLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 500);
    return () => clearInterval(t);
  }, [step]);

  async function begin() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const c = await createChallenge(adminUid, request.requestId);
      deadline.current = Date.now() + c.ttlMs;
      setSecondsLeft(Math.ceil(c.ttlMs / 1000));
      setCode(c.code);
      setInput('');
      setStep(2);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    if (lock.current) return;
    if (!input.trim()) { setError('Enter the confirmation code.'); return; }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await verifyChallenge(adminUid, request.requestId, input);
      await changeStatus(request, 'ACCEPTED', adminUid);
      await clearChallenge(adminUid, request.requestId).catch(() => {});
      onClose(true);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const expired = step === 2 && secondsLeft === 0;

  return (
    <Modal title={step === 1 ? 'Accept this request?' : 'Confirm acceptance'} onClose={() => onClose(false)} busy={busy}>
      {step === 1 ? (
        <>
          <p>
            You are about to accept <strong>{request.requestId}</strong> from <strong>{request.businessName}</strong>.
            The requestor will see the new status right away.
          </p>
          {error && <div className="alert error" role="alert">{error}</div>}
          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => onClose(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn" onClick={begin} disabled={busy} aria-busy={busy}>{busy ? 'Preparing...' : 'Continue'}</button>
          </div>
        </>
      ) : (
        <form onSubmit={confirm} noValidate>
          <p className="muted">Type the code below to confirm. It expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}.</p>
          <p className="confirm-code mono" aria-label="Confirmation code">{code}</p>
          <div className="field">
            <label htmlFor="confirm-input">Confirmation code</label>
            <input id="confirm-input" className="input mono" autoComplete="off" value={input}
              onChange={(e) => setInput(e.target.value)} disabled={busy || expired} />
          </div>
          {expired && <div className="alert error" role="alert" style={{ marginTop: '1rem' }}>The code has expired. Generate a new one.</div>}
          {error && !expired && <div className="alert error" role="alert" style={{ marginTop: '1rem' }}>{error}</div>}
          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => onClose(false)} disabled={busy}>Cancel</button>
            {expired || /Generate a new code/.test(error)
              ? <button type="button" className="btn" onClick={begin} disabled={busy}>Generate new code</button>
              : <button type="submit" className="btn" disabled={busy} aria-busy={busy}>{busy ? 'Processing...' : 'CONFIRM ACCEPTANCE'}</button>}
          </div>
        </form>
      )}
    </Modal>
  );
}
