import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    localStorage.setItem("procureiq_admin", JSON.stringify({ email }));
    navigate("/admin/dashboard");
  }

  return (
    <div className="auth-page admin-auth">
      <div className="auth-visual-panel admin-visual-panel">
        <Link to="/" className="auth-brand">
          ✦ Procure<span>IQ</span>
        </Link>

        <div className="auth-visual-copy">
          <span className="section-kicker light-kicker">
            <span className="kicker-dot">✦</span>
            ADMINISTRATION
          </span>
          <h1>ProcureIQ Administration</h1>
          <p>Manage standards intelligence and procurement data with a secure operational dashboard.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div
          className="auth-card admin-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="admin-badge">ADMIN CONSOLE</div>
          <h2>Secure access</h2>
          <p>Manage standards intelligence and procurement data.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <label>
              Admin Email
              <input
                type="email"
                placeholder="admin@procureiq.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Admin email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Admin password"
              />
            </label>

            <button type="submit" className="primary-btn auth-submit admin-submit">
              Enter Admin Console
            </button>
          </form>

          <div className="auth-links">
            <Link to="/login" className="back-home">
              ← User Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
