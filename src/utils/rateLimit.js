const PREFIX = 'arsheon:rl:';

function read(name) {
  try {
    const raw = window.localStorage.getItem(PREFIX + name);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(name, arr) {
  try {
    window.localStorage.setItem(PREFIX + name, JSON.stringify(arr));
  } catch {
    /* storage unavailable: throttle degrades gracefully */
  }
}

// Returns { limited, retryInMs } without recording an attempt.
export function checkLimit(name, { max, windowMs }) {
  const now = Date.now();
  const recent = read(name).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return { limited: true, retryInMs: windowMs - (now - recent[0]) };
  }
  return { limited: false, retryInMs: 0 };
}

export function recordAttempt(name, windowMs) {
  const now = Date.now();
  write(name, [...read(name).filter((t) => now - t < windowMs), now]);
}

export function clearLimit(name) {
  try {
    window.localStorage.removeItem(PREFIX + name);
  } catch {
    /* ignore */
  }
}

export function formatRetry(ms) {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.ceil(s / 60)} min` : `${s} s`;
}
