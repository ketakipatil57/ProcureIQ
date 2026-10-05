import { useState } from "react";
import { motion } from "motion/react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { PreferenceControls } from "./AppPreferences";
import { useAuthText } from "./auth/AuthTextContext";
import { getStoredAccessToken } from "../services/apiClient";


export default function Navbar() {
  const navigate = useNavigate();
  const user = getStoredAccessToken();
  const t = useAuthText();
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    localStorage.removeItem("procureiq_user");
    sessionStorage.removeItem("procureiq_access_token");
    sessionStorage.removeItem("procureiq_recommendation_state");
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
            {t("navStandards")}
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
            {t("navHow")}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
            {t("navAbout")}
          </NavLink>
        </div>

        <div className="nav-actions">
          <PreferenceControls />
          {user ? (
            <>
              <Link to="/dashboard" className="dashboard-link" onClick={() => setMenuOpen(false)}>
                {t("navDashboard")}
              </Link>
              <button type="button" className="login-button" onClick={() => { setMenuOpen(false); logout(); }}>
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-button" onClick={() => setMenuOpen(false)}>
                {t("navLogin")}
              </Link>
              <Link to="/register" className="get-started" onClick={() => setMenuOpen(false)}>
                {t("navRegister")} →
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
