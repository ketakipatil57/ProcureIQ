import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthText } from "../components/auth/AuthTextContext";

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
  const t = useAuthText();
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
        <Link to="/" className="admin-logo" aria-label="ProcureIQ home">
          <img src="/assets/procureiq-logo.png" alt="ProcureIQ" />
        </Link>

          <div className="admin-label">{t("adminConsole")}</div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <a className="active">{t("navDashboard")}</a>
          <a>{t("navStandards")}</a>
          <a>{t("certification")}</a>
          <a>{t("relationships")}</a>
          <a>{t("settings")}</a>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/">← {t("mainWebsite")}</Link>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <div>
            <span className="section-kicker small-kicker admin-kicker">
              <span className="kicker-dot">✦</span>
              {t("adminDashboard")}
            </span>
            <h1>{t("adminDashboardTitle")}</h1>
          </div>
          <div className="admin-user">{t("adminName")}</div>
        </header>

        <section className="admin-stats">
          <div>
            <span>{t("totalStandards")}</span>
            <strong>60</strong>
          </div>
          <div>
            <span>{t("activeStandards")}</span>
            <strong>48</strong>
          </div>
          <div>
            <span>{t("certificationRecords")}</span>
            <strong>24+</strong>
          </div>
          <div>
            <span>{t("relatedStandards")}</span>
            <strong>384</strong>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span className="section-kicker small-kicker admin-kicker">
                <span className="kicker-dot">✦</span>
                {t("standardsManagement")}
              </span>
              <h2>{t("manageStandards")}</h2>
            </div>

            <button type="button" className="primary-btn" onClick={() => setShowForm(!showForm)}>
              + {t("addStandard")}
            </button>
          </div>

          {showForm && (
            <div className="admin-add-form">
              <div>{t("prototypeForm")}</div>
              <button type="button" className="secondary-btn" onClick={addDemoStandard}>
                {t("addDemoStandard")}
              </button>
            </div>
          )}

          <div className="admin-table">
            <div className="admin-table-row admin-table-head">
              <span>{t("isNumber")}</span>
              <span>{t("standardTitleLabel")}</span>
              <span>{t("category")}</span>
              <span>{t("edition")}</span>
              <span>{t("status")}</span>
              <span>{t("certification")}</span>
              <span>{t("actions")}</span>
            </div>

            {standards.map((standard) => (
              <div className="admin-table-row" key={standard.id}>
                <span className="standard-number">{standard.id}</span>
                <span>{standard.title}</span>
                <span>{standard.category}</span>
                <span>2013</span>
                <span><b className="status-pill">{standard.status}</b></span>
                <span>BIS Product Certification</span>
                <Link to={`/standards/${encodeURIComponent(standard.id)}`}>{t("viewDetails")} →</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
