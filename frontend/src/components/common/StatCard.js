import React from 'react';

export default function StatCard({ label, value, icon, color = '#1e40af', sub }) {
  return (
    <div className="stat-card">
      <div style={{
        width: 50, height: 50, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
