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
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        
        {/* Logo + Back Button */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>

          {/* LEFT: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🏢</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                Mangalyog
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                Enterprise
              </div>
            </div>
          </div>

          {/* RIGHT: Back Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="sidebar-back-btn"
          >
            ←
          </button>
        </div>

        {/* Nav */}
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

        {/* User + Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 10,
          }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
              {admin?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {admin?.email}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{
              width: '100%',
              color: 'rgba(255,255,255,0.8)',
              borderColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}