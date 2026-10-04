import { useState } from "react";
import { motion } from "motion/react";
import { Link, NavLink, useNavigate } from "react-router-dom";


export default function Navbar() {
  const navigate = useNavigate();
  const user = localStorage.getItem("procureiq_user");
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    localStorage.removeItem("procureiq_user");
    sessionStorage.removeItem("procureiq_access_token");
    navigate("/");
  }

  return (
    <motion.nav
      className="navbar"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`nav-inner${menuOpen ? " is-menu-open" : ""}`}>
        <Link to="/" className="brand" aria-label="ProcureIQ home">
          <span className="brand-logo-frame">
            <img className="brand-logo" src="/assets/procureiq-logo.png" alt="" />
          </span>
          <span className="brand-name">
            Procure<span>IQ</span>
          </span>
        </Link>

        <button
          type="button"
          className="nav-menu-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="nav-links" id="public-navigation" aria-label="Main navigation">
          <NavLink to="/standards" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
            Standards
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
            How It Works
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
            About
          </NavLink>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="dashboard-link" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <button type="button" className="login-button" onClick={() => { setMenuOpen(false); logout(); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-button" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="get-started" onClick={() => setMenuOpen(false)}>
                Get Started →
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
