import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

const demoResults = [
  {
    is_number: "IS 8112:2013",
    title: "Ordinary Portland Cement, 43 Grade — Specification",
    category: "Civil / Construction",
    score: 0.684
  },
  {
    is_number: "IS 269:2015",
    title: "Ordinary Portland Cement — Specification",
    category: "Civil / Construction",
    score: 0.654
  },
  {
    is_number: "IS 455:2015",
    title: "Portland Slag Cement — Specification",
    category: "Civil / Construction",
    score: 0.621
  }
];

const quickActions = [
  { label: "Search Standards", icon: "⌕", to: "/standards" },
  { label: "Browse Standards", icon: "▣", to: "/standards" },
  { label: "Upload Tender", icon: "↑", to: "/dashboard" },
  { label: "View Certifications", icon: "✓", to: "/about" }
];

const recentSearches = [
  "Road construction cement",
  "Electrical safety equipment",
  "Packaging material standards"
];

function getDashboardGreeting() {
  const storedUser = localStorage.getItem("procureiq_user");
  if (!storedUser) return "Hello there";

  try {
    const user = JSON.parse(storedUser);
    const name = user.name?.trim()
      || user.username?.trim()
      || user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();

    return name
      ? `Hello, ${name.replace(/\b\w/g, (letter) => letter.toUpperCase())}`
      : "Hello there";
  } catch {
    return "Hello there";
  }
}

export default function UserDashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const greeting = getDashboardGreeting();

  async function searchStandards() {
    if (!query.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: query })
      });

      if (!response.ok) {
        throw new Error("AI service unavailable");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error(error);
      setResults(demoResults);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell dashboard-shell">
      <header className="dashboard-header">
        <div className="container nav-row">
          <Link to="/" className="dashboard-brand">
            ✦ Procure<span>IQ</span>
          </Link>

          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <Link to="/standards">Standards</Link>
            <Link to="/about">About</Link>
            <Link to="/">Home</Link>
          </nav>
        </div>
      </header>

      <main className="container dashboard-main">
        <motion.section
          className="dashboard-welcome"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <span className="section-kicker">
              <span className="kicker-dot">✦</span>
              PROCUREMENT INTELLIGENCE
            </span>
            <h1>{greeting}</h1>
            <p>
              Discover relevant Indian Standards from your procurement requirements.
            </p>
          </div>
          <div className="live-pill">Live matching engine</div>
        </motion.section>

        <section className="search-panel">
          <div className="panel-heading">
            <h2>Find the right standard</h2>
          </div>

          <div className="search-panel-row">
            <div className="panel-input">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchStandards();
                  }
                }}
                placeholder="Describe your procurement requirement..."
                aria-label="Describe your procurement requirement"
              />
            </div>
            <button type="button" className="primary-btn" onClick={searchStandards} disabled={loading}>
              {loading ? "Analyzing..." : "Search Standards"}
            </button>
          </div>

          <div className="inline-actions">
            <button type="button" className="secondary-btn alt-button">
              Upload Tender PDF
            </button>
            <span className="example-text">Example: “Road construction ke liye cement chahiye”</span>
          </div>
        </section>

        <div className="dashboard-layout">
          <section className="results-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker small-kicker">
                  <span className="kicker-dot">✦</span>
                  AI RECOMMENDATIONS
                </span>
                <h2>Recommended Standards</h2>
              </div>
              {results.length > 0 && <span className="result-count">{results.length} matches</span>}
            </div>

            {results.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">✦</div>
                <h3>No standards found yet</h3>
                <p>Try another search term or describe the requirement more clearly.</p>
              </div>
            ) : (
              <div className="results-list">
                {results.map((item, index) => {
                  const score = Math.round((item.score || 0) * 100);
                  const key = item.is_number || item.id || `${item.title}-${index}`;

                  return (
                    <Link to={`/standards/${encodeURIComponent(key)}`} className="result-card" key={key}>
                      <div className="result-rank">0{index + 1}</div>

                      <div className="result-info">
                        <span className="standard-number">{key}</span>
                        <h3>{item.title}</h3>
                        <div className="result-meta">
                          <span>{item.category || "Civil / Construction"}</span>
                          <span>Edition {item.edition || "2013"}</span>
                          <span className="status-badge">Active</span>
                        </div>
                      </div>

                      <div className="score-box">
                        <strong>{score}%</strong>
                        <span>Semantic Match</span>
                        <div className="score-bar">
                          <span style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="dashboard-side-panel">
            <div className="quick-actions-card">
              <div className="panel-header compact-header">
                <div>
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    QUICK ACTIONS
                  </span>
                  <h3>Workflow</h3>
                </div>
              </div>

              <div className="quick-actions-grid">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.to} className="quick-action-card">
                    <span className="quick-action-icon">{action.icon}</span>
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="recent-searches-card">
              <div className="panel-header compact-header">
                <div>
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    RECENT SEARCHES
                  </span>
                  <h3>Recent</h3>
                </div>
              </div>

              <ul className="recent-list">
                {recentSearches.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => setQuery(item)}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
