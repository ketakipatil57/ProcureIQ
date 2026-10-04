import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const initialStandards = [
  {
    id: "IS 8112:2013",
    title: "Ordinary Portland Cement, 43 Grade",
    category: "Civil / Construction",
    status: "Active"
  },
  {
    id: "IS 269:2015",
    title: "Ordinary Portland Cement",
    category: "Civil / Construction",
    status: "Active"
  },
  {
    id: "IS 455:2015",
    title: "Portland Slag Cement",
    category: "Civil / Construction",
    status: "Active"
  }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [standards, setStandards] = useState(initialStandards);
  const [showForm, setShowForm] = useState(false);

  function logout() {
    localStorage.removeItem("procureiq_admin");
    navigate("/admin/login");
  }

  function addDemoStandard() {
    const newStandard = {
      id: `IS DEMO:${standards.length + 1}`,
      title: "New Prototype Standard",
      category: "General",
      status: "Draft"
    };

    setStandards([...standards, newStandard]);
    setShowForm(false);
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-logo">
          ✦ Procure<span>IQ</span>
        </Link>

        <div className="admin-label">ADMIN CONSOLE</div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <a className="active">Dashboard</a>
          <a>Standards</a>
          <a>Certifications</a>
          <a>Relationships</a>
          <a>Settings</a>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/">← Main Website</Link>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <div>
            <span className="section-kicker small-kicker admin-kicker">
              <span className="kicker-dot">✦</span>
              ADMIN DASHBOARD
            </span>
            <h1>Procurement Intelligence Control Center</h1>
          </div>
          <div className="admin-user">Admin</div>
        </header>

        <section className="admin-stats">
          <div>
            <span>Total Standards</span>
            <strong>60</strong>
          </div>
          <div>
            <span>Active Standards</span>
            <strong>48</strong>
          </div>
          <div>
            <span>Certification Records</span>
            <strong>24+</strong>
          </div>
          <div>
            <span>Related Standards</span>
            <strong>384</strong>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span className="section-kicker small-kicker admin-kicker">
                <span className="kicker-dot">✦</span>
                STANDARDS MANAGEMENT
              </span>
              <h2>Manage Standards</h2>
            </div>

            <button type="button" className="primary-btn" onClick={() => setShowForm(!showForm)}>
              + Add Standard
            </button>
          </div>

          {showForm && (
            <div className="admin-add-form">
              <div>Prototype add-standard form.</div>
              <button type="button" className="secondary-btn" onClick={addDemoStandard}>
                Add Demo Standard
              </button>
            </div>
          )}

          <div className="admin-table">
            <div className="admin-table-row admin-table-head">
              <span>IS Number</span>
              <span>Title</span>
              <span>Category</span>
              <span>Edition</span>
              <span>Status</span>
              <span>Certification</span>
              <span>Actions</span>
            </div>

            {standards.map((standard) => (
              <div className="admin-table-row" key={standard.id}>
                <span className="standard-number">{standard.id}</span>
                <span>{standard.title}</span>
                <span>{standard.category}</span>
                <span>2013</span>
                <span><b className="status-pill">{standard.status}</b></span>
                <span>BIS Product Certification</span>
                <Link to={`/standards/${encodeURIComponent(standard.id)}`}>View →</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
