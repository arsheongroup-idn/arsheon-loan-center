import { useEffect, useRef } from 'react';

export default function Modal({ title, children, onClose, busy = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    const first = ref.current?.querySelector('input, button, textarea, select');
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea, select, a[href]');
        if (!f.length) return;
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose, busy]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
