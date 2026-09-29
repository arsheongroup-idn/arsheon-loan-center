import {
  ref, get, set, update, remove, push, onValue, query, orderByChild, equalTo, serverTimestamp,
} from 'firebase/database';
import { requireDb } from '../config/firebase.js';
import { TRANSITIONS, TIMESTAMP_FIELD } from '../utils/constants.js';
import { checkLimit, recordAttempt, formatRetry } from '../utils/rateLimit.js';
import { appError } from '../utils/errors.js';

const AUDIT_ACTION = {
  UNDER_REVIEW: 'REQUEST_REVIEWED',
  ACCEPTED: 'REQUEST_ACCEPTED',
  REJECTED: 'REQUEST_REJECTED',
  CONTACT_REQUIRED: 'CONTACT_REQUIRED',
  AGREEMENT: 'AGREEMENT',
  FUNDED: 'FUNDED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

export const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFY_LIMIT = { max: 8, windowMs: 10 * 60 * 1000 };

/* ---------- Realtime listeners (all return an unsubscribe function) ---------- */

export function watchRequests(onData, onError) {
  const db = requireDb();
  return onValue(
    ref(db, 'loanRequests'),
    (snap) => onData(Object.values(snap.val() ?? {}).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
    onError
  );
}

export function watchRequest(requestId, onData, onError) {
  const db = requireDb();
  return onValue(ref(db, `loanRequests/${requestId}`), (snap) => onData(snap.val()), onError);
}

export function watchNotes(requestId, onData, onError) {
  const db = requireDb();
  return onValue(ref(db, `internal/loanRequests/${requestId}/internalNotes`), (snap) => onData(snap.val() ?? ''), onError);
}

export function watchAudit(requestId, onData, onError) {
  const db = requireDb();
  const q = query(ref(db, 'auditLogs'), orderByChild('requestId'), equalTo(requestId));
  return onValue(
    q,
    (snap) => onData(Object.values(snap.val() ?? {}).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))),
    onError
  );
}

/* ---------- Mutations ---------- */

export async function saveNotes(requestId, adminUid, text) {
  const db = requireDb();
  const ts = serverTimestamp();
  const logKey = push(ref(db, 'auditLogs')).key;
  await update(ref(db), {
    [`internal/loanRequests/${requestId}/internalNotes`]: text,
    [`internal/loanRequests/${requestId}/updatedAt`]: ts,
    [`internal/loanRequests/${requestId}/updatedBy`]: adminUid,
    [`auditLogs/${logKey}`]: { requestId, adminId: adminUid, action: 'NOTES_UPDATED', timestamp: ts },
  });
}

// Changes status on the private record AND its public mirror in one atomic write,
// and appends an audit log. Database rules re-check the lifecycle server-side.
export async function changeStatus(request, newStatus, adminUid) {
  const db = requireDb();
  if (!TRANSITIONS[request.status]?.includes(newStatus)) {
    throw appError('invalid-transition', `Cannot change status from ${request.status} to ${newStatus}.`);
  }
  const id = request.requestId;
  const ts = serverTimestamp();
  const logKey = push(ref(db, 'auditLogs')).key;
  const updates = {
    [`loanRequests/${id}/status`]: newStatus,
    [`loanRequests/${id}/updatedAt`]: ts,
    [`publicStatus/${request.accessTokenHash}/status`]: newStatus,
    [`publicStatus/${request.accessTokenHash}/updatedAt`]: ts,
    [`auditLogs/${logKey}`]: {
      requestId: id, adminId: adminUid, action: AUDIT_ACTION[newStatus],
      previousStatus: request.status, newStatus, timestamp: ts,
    },
  };
  const stamp = TIMESTAMP_FIELD[newStatus];
  if (stamp) updates[`loanRequests/${id}/${stamp}`] = ts;
  await update(ref(db), updates);
}

/* ---------- ACCEPT confirmation challenge ---------- */

async function serverNow() {
  const db = requireDb();
  const offset = (await get(ref(db, '.info/serverTimeOffset'))).val() ?? 0;
  return Date.now() + offset;
}

const challengeRef = (uid, requestId) => ref(requireDb(), `adminChallenges/${uid}/${requestId}`);

export async function createChallenge(uid, requestId) {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  const code = `AR-${String(n).padStart(4, '0')}`;
  const expiresAt = (await serverNow()) + CHALLENGE_TTL_MS;
  await set(challengeRef(uid, requestId), { code, expiresAt, attempts: 0, verified: false });
  return { code, ttlMs: CHALLENGE_TTL_MS };
}

export async function verifyChallenge(uid, requestId, input) {
  const limit = checkLimit('verify', VERIFY_LIMIT);
  if (limit.limited) {
    throw appError('rate-limited', `Too many verification attempts. Try again in ${formatRetry(limit.retryInMs)}.`);
  }
  recordAttempt('verify', VERIFY_LIMIT.windowMs);

  const snap = await get(challengeRef(uid, requestId));
  const c = snap.val();
  if (!c) throw appError('challenge-expired', 'The confirmation code has expired. Generate a new one.');
  if ((await serverNow()) > c.expiresAt) {
    await remove(challengeRef(uid, requestId));
    throw appError('challenge-expired', 'The confirmation code has expired. Generate a new one.');
  }
  if (c.attempts >= MAX_ATTEMPTS) {
    throw appError('challenge-locked', 'Too many wrong attempts. Generate a new code.');
  }
  if (String(input).trim().toUpperCase() !== c.code) {
    const attempts = c.attempts + 1;
    await set(ref(requireDb(), `adminChallenges/${uid}/${requestId}/attempts`), attempts);
    throw appError(
      attempts >= MAX_ATTEMPTS ? 'challenge-locked' : 'challenge-wrong',
      attempts >= MAX_ATTEMPTS
        ? 'Too many wrong attempts. Generate a new code.'
        : `Incorrect code. ${MAX_ATTEMPTS - attempts} attempt(s) left.`
    );
  }
  await set(ref(requireDb(), `adminChallenges/${uid}/${requestId}/verified`), true);
}

export async function clearChallenge(uid, requestId) {
  await remove(challengeRef(uid, requestId));
}
