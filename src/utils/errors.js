// Maps technical errors to safe, user-facing messages. Internal details are never shown.
export function toFriendlyError(err) {
  const code = String(err?.code ?? '').toLowerCase();
  if (code.startsWith('app/') && code !== 'app/not-configured') return err.message;
  if (code === 'app/not-configured') return 'The service is not configured. Check the environment setup.';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
  if (code === 'auth/user-disabled') return 'This account has been disabled.';
  if (code.includes('permission')) return 'Not permitted. The request may have changed or your access is not authorized. Refresh and try again.';
  if (code.includes('network') || code.includes('unavailable') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 'Network problem. Check your connection and try again.';
  }
  return 'Something went wrong on the server. Please try again shortly.';
}

export function appError(code, message) {
  const e = new Error(message);
  e.code = `app/${code}`;
  return e;
}
