import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { auth, db } from '../config/firebase.js';
import { checkLimit, clearLimit, formatRetry, recordAttempt } from '../utils/rateLimit.js';
import { appError } from '../utils/errors.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const LOGIN_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, isAdmin: false });

  useEffect(() => {
    if (!auth) { setState({ loading: false, user: null, isAdmin: false }); return undefined; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous) { setState({ loading: false, user: null, isAdmin: false }); return; }
      try {
        // Authorization lives in the database: admins/{uid} = true (set manually in the console).
        const snap = await get(ref(db, `admins/${user.uid}`));
        setState({ loading: false, user, isAdmin: snap.val() === true });
      } catch {
        setState({ loading: false, user, isAdmin: false });
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      async login(email, password) {
        const limit = checkLimit('login', LOGIN_LIMIT);
        if (limit.limited) throw appError('rate-limited', `Too many failed sign-in attempts. Try again in ${formatRetry(limit.retryInMs)}.`);
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
          clearLimit('login');
        } catch (err) {
          recordAttempt('login', LOGIN_LIMIT.windowMs);
          throw err;
        }
      },
      logout: () => signOut(auth),
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
