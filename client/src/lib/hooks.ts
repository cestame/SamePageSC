import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

/** Runs `load` whenever `deps` change and exposes loading, error and success states plus a retry. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): [AsyncState<T>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    load()
      .then((data) => { if (!cancelled) setState({ status: 'success', data }); })
      .catch((error: Error) => { if (!cancelled) setState({ status: 'error', error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return [state, retry];
}

/** Current hash route split into path segments and query parameters. */
export function useHashRoute() {
  const read = () => {
    const [path, query] = window.location.hash.replace(/^#/, '').split('?');
    return { parts: (path || '/').split('/').filter(Boolean), params: new URLSearchParams(query || '') };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(hash: string) {
  window.location.hash = hash;
}
