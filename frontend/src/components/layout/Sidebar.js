import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', end: true, section: 'Main' },
  { path: '/sites', label: 'Sites', icon: '🏗️' },
  { path: '/transactions', label: 'Transactions', icon: '💰' },
  { path: '/invoices', label: 'Invoices', icon: '🧾', section: 'Documents' },
  { path: '/quotations', label: 'Quotations', icon: '📋' },
];

export default function Sidebar({ open, onClose }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* Logo */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Logo Image */}
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
            }}>
              <img
                src={logo}
                alt="MangalYog Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
              />
            </div>

            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, letterSpacing: '0.01em' }}>
                MangalYog
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 1 }}>
                Enterprise
              </div>
            </div>
          </div>

          {/* Close Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="sidebar-back-btn"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 10 }}>
          {navItems.map(({ path, label, icon, end, section }) => (
            <React.Fragment key={path}>
              {section && (
                <div style={{
                  padding: '14px 18px 6px',
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.25)',
                }}>
                  {section}
                </div>
              )}
              <NavLink
                to={path}
                end={end}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        {/* Founder + Logout */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 11, padding: '12px 14px',
            marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 11,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              RP
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                Raghuraj Patil
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                Founder · MangalYog Enterprise
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: 'rgba(239,68,68,0.8)',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'rgba(239,68,68,0.8)'; }}
          >
            🚪 Logout
          </button>
        </div>

      </aside>
    </>
  );
}