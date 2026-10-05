import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { apiRequest } from "../services/apiClient";
import { PreferenceControls } from "../components/AppPreferences";
import { useAuthText } from "../components/auth/AuthTextContext";

const quickActions = [
  { label: "searchButton", icon: "⌕", to: "/standards" },
  { label: "browseStandards", icon: "▣", to: "/standards" },
  { label: "uploadTender", icon: "↑", to: "/dashboard" },
  { label: "viewCertifications", icon: "✓", to: "/about" }
];

const recentSearches = [
  "Road construction cement",
  "Electrical safety equipment",
  "Packaging material standards"
];

const RECOMMENDATION_STATE_KEY = "procureiq_recommendation_state";

function loadRecommendationState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(RECOMMENDATION_STATE_KEY));
    if (
      state?.version !== 1
      || typeof state.query !== "string"
      || !Array.isArray(state.results)
      || !["text", "pdf"].includes(state.mode)
      || !state.results.every((item) => item && typeof item === "object" && typeof item.title === "string")
    ) {
      return null;
    }

    return {
      query: state.query,
      results: state.results,
      mode: state.mode,
      selectedFileName: typeof state.selectedFileName === "string" ? state.selectedFileName : ""
    };
  } catch {
    return null;
  }
}

function saveRecommendationState(state) {
  try {
    sessionStorage.setItem(RECOMMENDATION_STATE_KEY, JSON.stringify({ version: 1, ...state }));
  } catch {
    // If session storage is unavailable, the dashboard still works in memory.
  }
}

function getDashboardGreeting(t) {
  const storedUser = localStorage.getItem("procureiq_user");
  if (!storedUser) return t("helloThere");

  try {
    const user = JSON.parse(storedUser);
    const name = user.name
      || user.username
      || user.email?.split("@")[0];

    return name
      ? `${t("greetingPrefix")} ${name}`
      : t("helloThere");
  } catch {
    return t("helloThere");
  }
}

export default function UserDashboard() {
  const t = useAuthText();
  const fileInputRef = useRef(null);
  const [restoredState] = useState(loadRecommendationState);
  const [query, setQuery] = useState(() => restoredState?.query ?? "");
  const [results, setResults] = useState(() => restoredState?.results ?? []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState(() => restoredState?.selectedFileName ?? "");
  const [searchError, setSearchError] = useState("");
  const greeting = getDashboardGreeting(t);

  async function searchStandards() {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setSearchError("");

    try {
      const data = await apiRequest("/recommendations", {
        method: "POST",
        body: JSON.stringify({ query })
      });
      const nextResults = Array.isArray(data?.results) ? data.results : [];
      setResults(nextResults);
      setSelectedFileName("");
      setUploadError("");
      saveRecommendationState({ query, results: nextResults, mode: "text", selectedFileName: "" });
    } catch (error) {
      setResults([]);
      if (error.status === 401 || error.status === 403) {
        setSearchError(t("sessionError"));
      } else if (error.status === 400) {
        setSearchError(t("validationError"));
      } else if (error.status === 502) {
        setSearchError(t("serviceError"));
      } else if (error.code === "API_NETWORK_ERROR") {
        setSearchError(t("backendError"));
      } else {
        setSearchError(t("genericError"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function uploadTender(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }

    setSelectedFileName(file.name);
    setUploadError("");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("The selected file must be a PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("The PDF must be 10 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const data = await apiRequest("/recommendations/pdf", {
        method: "POST",
        body: formData
      });
      const nextResults = Array.isArray(data?.results) ? data.results : [];
      setResults(nextResults);
      saveRecommendationState({ query, results: nextResults, mode: "pdf", selectedFileName: file.name });
      setSearchError("");
    } catch (error) {
      setResults([]);
      if (error.status === 400) {
        setUploadError("The PDF could not be processed. Please check the file and try again.");
      } else if (error.status === 401 || error.status === 403) {
        setUploadError(t("sessionError"));
      } else if (error.status === 413) {
        setUploadError("The PDF must be 10 MB or smaller.");
      } else if (error.status === 502) {
        setUploadError(t("serviceError"));
      } else if (error.code === "API_NETWORK_ERROR" || error.code === "AUTH_API_NOT_CONFIGURED") {
        setUploadError(t("backendError"));
      } else {
        setUploadError(t("genericError"));
      }
    } finally {
      setUploading(false);
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
            <Link to="/standards">{t("navStandards")}</Link>
            <Link to="/about">{t("navAbout")}</Link>
            <Link to="/">{t("home")}</Link>
          </nav>
          <PreferenceControls />
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
              {t("procurementIntelligence")}
            </span>
            <h1>{greeting}</h1>
            <p>
              {t("dashboardIntro")}
            </p>
          </div>
          <div className="live-pill">{t("liveMatching")}</div>
        </motion.section>

        <section className="search-panel">
          <div className="panel-heading">
            <h2>{t("findStandard")}</h2>
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
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
              />
            </div>
            <button type="button" className="primary-btn" onClick={searchStandards} disabled={loading}>
              {loading ? t("analyzing") : t("searchButton")}
            </button>
          </div>

          <div className="inline-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={uploadTender}
              onCancel={() => setUploadError("Please select a PDF file to upload.")}
              hidden
            />
            <button
              type="button"
              className="secondary-btn alt-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? t("analyzing") : t("uploadTender")}
            </button>
            {selectedFileName && <span className="example-text">{selectedFileName}</span>}
            {uploadError && <span className="example-text" role="alert">{uploadError}</span>}
            <span className="example-text">{t("example")} “Road construction ke liye cement chahiye”</span>
          </div>
        </section>

        <div className="dashboard-layout">
          <section className="results-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker small-kicker">
                  <span className="kicker-dot">✦</span>
                  {t("aiRecommendations")}
                </span>
                <h2>{t("recommendedStandards")}</h2>
              </div>
              {results.length > 0 && <span className="result-count">{results.length} {t("matches")}</span>}
            </div>

            {searchError ? (
              <div className="empty-results" role="alert">
                <h3>{searchError}</h3>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">✦</div>
                <h3>{t("noMatches")}</h3>
                <p>{t("tryAnother")}</p>
              </div>
            ) : (
              <div className="results-list">
                {results.map((item, index) => {
                  const score = Math.round((item.score || 0) * 100);
                  const key = item.isNumber || `${item.title}-${index}`;

                  return (
                    <Link
                      to={`/standards/${encodeURIComponent(key)}`}
                      state={{ fromRecommendations: true }}
                      className="result-card"
                      key={key}
                    >
                      <div className="result-rank">0{index + 1}</div>

                      <div className="result-info">
                        <span className="standard-number">{key}</span>
                        <h3>{item.title}</h3>
                        <div className="result-meta">
                          {item.category && <span>{item.category}</span>}
                          {item.editionYear && <span>{t("edition")} {item.editionYear}</span>}
                          {item.status && <span className="status-badge">{item.status}</span>}
                        </div>
                      </div>

                      <div className="score-box">
                        <strong>{score}%</strong>
                        <span>{t("semanticMatch")}</span>
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
                    {t("quickActions")}
                  </span>
                  <h3>{t("workflow")}</h3>
                </div>
              </div>

              <div className="quick-actions-grid">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.to} className="quick-action-card">
                    <span className="quick-action-icon">{action.icon}</span>
                    <span>{t(action.label)}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="recent-searches-card">
              <div className="panel-header compact-header">
                <div>
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    {t("recentSearches")}
                  </span>
                  <h3>{t("recent")}</h3>
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
