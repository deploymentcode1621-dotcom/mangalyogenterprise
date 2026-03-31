import React from 'react';
import { useLocation } from 'react-router-dom';

const titleMap = {
  '/': 'Dashboard',
  '/sites': 'Sites',
  '/transactions': 'Transactions',
  '/invoices': 'Invoices',
  '/quotations': 'Quotations',
};

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const title = titleMap[base] || 'Mangalyog Enterprise';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onMenuClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, padding: '4px 8px', color: '#475569',
            borderRadius: 8, lineHeight: 1,
          }}
          className="menu-btn"
        >
          ☰
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{title}</h1>
      </div>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}