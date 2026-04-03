import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', end: true },
  { path: '/sites', label: 'Sites', icon: '🏗️' },
  { path: '/transactions', label: 'Transactions', icon: '💰' },
  { path: '/invoices', label: 'Invoices', icon: '🧾' },
  { path: '/quotations', label: 'Quotations', icon: '📋' },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                🏢
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  Mangalyog
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                  Enterprise
                </div>
              </div>
            </div>

            {/* 🔥 FIXED CLOSE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Arrow clicked");
                onClose();
              }}
              title="Close Sidebar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: '#fff',
                zIndex: 1001
              }}
            >
              ←
            </button>

          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, paddingTop: 12 }}>
          {navItems.map(({ path, label, icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 10,
          }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
              MangalYog Enterprises
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              Founder Raghuraj Patil
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{
              width: '100%',
              color: 'rgba(255,255,255,0.8)',
              borderColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
            }}
          >
            🚪 Logout
          </button>
        </div>

      </aside>
    </>
  );
}