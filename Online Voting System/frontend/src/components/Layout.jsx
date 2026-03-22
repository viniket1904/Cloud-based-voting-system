import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="nav">
        <NavLink to="/app" className="nav-brand">Cloud Based Voting System</NavLink>
        <div className="nav-links">
          {user?.is_admin && (
            <>
              <NavLink to="/app">Elections</NavLink>
              <NavLink to="/app/admin">Admin</NavLink>
            </>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.name}
          </span>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
