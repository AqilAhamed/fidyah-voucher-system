import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('adminToken'); navigate('/login'); };

  const links = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/users',     icon: '👥', label: 'Beneficiaries' },
    { to: '/merchants', icon: '🏪', label: 'Merchants' },
    { to: '/ledger',    icon: '💰', label: 'Ledger & Payouts' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🕌 MUIS Admin</h2>
          <span>Fidyah Voucher Portal</span>
        </div>
        <nav>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="icon">{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="nav-link" style={{ color: '#ff6b6b', background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '11px 20px', marginBottom: 16, cursor: 'pointer', fontSize: 14, borderLeft: '3px solid transparent' }}>
          <span className="icon">🚪</span> Log Out
        </button>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
