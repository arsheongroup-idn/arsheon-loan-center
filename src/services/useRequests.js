import { useEffect, useState } from 'react';
import { watchRequests } from './adminService.js';
import { toFriendlyError } from '../utils/errors.js';

export default function useRequests() {
  const [state, setState] = useState({ loading: true, error: '', items: [] });
  useEffect(
    () =>
      watchRequests(
        (items) => setState({ loading: false, error: '', items }),
        (err) => setState({ loading: false, error: toFriendlyError(err), items: [] })
      ),
    []
  );
  return state;
}
