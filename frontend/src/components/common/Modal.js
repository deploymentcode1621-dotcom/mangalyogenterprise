import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}>
        <div className="modal-header">
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#94a3b8', lineHeight: 1,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
