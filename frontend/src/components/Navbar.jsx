// components/Navbar.jsx
// Top masthead + navigation. Shows different links for guests and
// logged-in users. Collapses into a dropdown menu on small screens.

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Flame, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  const initial = user && user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div>
      {/* Thin ink strip above the bar — the "masthead" of the ledger. */}
      <div className="top-strip">
        <strong>Strict</strong> · <strong>Funny</strong> ·{" "}
        <strong>Dreamer</strong> — three fictional investors, one honest verdict
      </div>

      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark">
              <Flame size={18} />
            </span>
            Startup Roast Arena
          </Link>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={"nav-links" + (menuOpen ? " open" : "")}>
            <NavLink to="/" className="nav-link" onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/leaderboard" className="nav-link" onClick={closeMenu}>
              Leaderboard
            </NavLink>

            {user && (
              <>
                <NavLink to="/dashboard" className="nav-link" onClick={closeMenu}>
                  Dashboard
                </NavLink>
                <NavLink to="/my-ideas" className="nav-link" onClick={closeMenu}>
                  My Ideas
                </NavLink>
                <NavLink to="/submit" className="nav-link" onClick={closeMenu}>
                  Submit
                </NavLink>
              </>
            )}

            {!user && (
              <div className="nav-user">
                <NavLink to="/login" className="nav-link" onClick={closeMenu}>
                  Login
                </NavLink>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  onClick={closeMenu}
                >
                  Sign up
                </Link>
              </div>
            )}

            {user && (
              <div className="nav-user">
                <span className="row" style={{ gap: 8 }}>
                  <span className="avatar">{initial}</span>
                  <span className="small">{user.name}</span>
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
}
