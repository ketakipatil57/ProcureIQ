import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import StandardCard from "../components/StandardCard";
import { displayValue, loadStandards } from "../data/standards";
import { useAuthText } from "../components/auth/AuthTextContext";

const pageSize = 12;

export default function StandardsPage() {
  const t = useAuthText();
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [certification, setCertification] = useState("All");
  const [page, setPage] = useState(1);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    loadStandards()
      .then((records) => {
        if (mounted) setStandards(records);
      })
      .catch((loadError) => {
        console.error(loadError);
        if (mounted) setError(loadError.message || "Unable to load standards.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(standards.map((standard) => standard.category).filter(Boolean))].sort(),
    [standards]
  );
  const statuses = useMemo(
    () => [...new Set(standards.map((standard) => standard.status).filter(Boolean))].sort(),
    [standards]
  );
  const certifications = useMemo(
    () => [...new Set(standards.map((standard) => standard.certification_status).filter(Boolean))].sort(),
    [standards]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return standards.filter((standard) => {
      const matchesSearch = !query || Object.values(standard).some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
      return matchesSearch
        && (category === "All" || standard.category === category)
        && (status === "All" || standard.status === status)
        && (certification === "All" || standard.certification_status === certification);
    });
  }, [standards, search, category, status, certification]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const startIndex = (currentPage - 1) * pageSize;
  const visibleStandards = filtered.slice(startIndex, startIndex + pageSize);
  const hasActiveFilters = Boolean(
    search.trim() || category !== "All" || status !== "All" || certification !== "All"
  );

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setCertification("All");
    setPage(1);
  }

  function updatePage(nextPage) {
    setPage(nextPage);
    document.querySelector(".standards-library-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="page-shell standards-shell">
      <Navbar />

      <main className="standards-library-v2 container">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Standards" }]} />
        <section className="standards-library-heading">
          <div>
            <span className="section-kicker">
              <span className="kicker-dot">✦</span>
              PROCUREIQ KNOWLEDGE BASE
            </span>
            <h1>{t("libraryTitle")}</h1>
            <p>{t("libraryIntro")}</p>
          </div>
          <span className="library-index-mark" aria-hidden="true">IS<span> / </span>IQ</span>
        </section>

        <section className="standards-library-stats" aria-label="Library overview">
          <div className="library-stat-card">
            <strong>{standards.length || "60"}</strong>
            <span>{t("curated")}</span>
          </div>
          <div className="library-stat-card">
            <strong>{categories.length || "4"}</strong>
            <span>{t("categories")}</span>
          </div>
          <div className="library-stat-card">
            <strong>{t("searchButton")}</strong>
            <span>{t("acrossCorpus")}</span>
          </div>
          <div className="library-stat-card library-stat-compliance">
            <strong>{t("compliance")}</strong>
            <span>{t("information")}</span>
          </div>
        </section>

        <section className="standards-library-tools" aria-label={t("searchAllStandards")}>
          <label className="library-search-v2">
            <span className="library-search-icon" aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder={t("searchAllStandards")}
              aria-label={t("searchAllStandards")}
            />
            {search && (
              <button type="button" className="search-clear-button" onClick={() => updateFilter(setSearch, "")} aria-label={t("clearSearch")}>
                ×
              </button>
            )}
          </label>

          <div className="library-filter-row">
            <label className="library-filter-control">
                <span>{t("category")}</span>
              <select value={category} onChange={(event) => updateFilter(setCategory, event.target.value)} aria-label={t("filterByCategory")}>
                <option value="All">{t("allCategories")}</option>
                {categories.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <label className="library-filter-control">
                <span>{t("status")}</span>
              <select value={status} onChange={(event) => updateFilter(setStatus, event.target.value)} aria-label={t("filterByStatus")}>
                <option value="All">{t("allStatuses")}</option>
                {statuses.map((item) => <option value={item} key={item}>{displayValue(item)}</option>)}
              </select>
            </label>
            <label className="library-filter-control">
                <span>{t("certification")}</span>
              <select value={certification} onChange={(event) => updateFilter(setCertification, event.target.value)} aria-label={t("filterByCertification")}>
                <option value="All">{t("allCertifications")}</option>
                {certifications.map((item) => <option value={item} key={item}>{displayValue(item)}</option>)}
              </select>
            </label>
          </div>
        </section>

        <div className="library-category-chips" role="group" aria-label={t("quickCategory")}>
          {["All", ...categories].map((item) => (
            <button
              key={item}
              type="button"
              className={item === category ? "library-category-chip is-selected" : "library-category-chip"}
              onClick={() => updateFilter(setCategory, item)}
              aria-pressed={item === category}
            >
              {item === "All" ? t("all") : item}
            </button>
          ))}
        </div>

        <div className="standards-library-results-bar" aria-live="polite">
          <p>
            {filtered.length === 0
              ? `${t("showing")} 0 ${t("navStandards").toLowerCase()}`
              : `${t("showing")} ${startIndex + 1}–${Math.min(startIndex + pageSize, filtered.length)} ${t("of")} ${filtered.length}${hasActiveFilters ? ` (${t("matches")})` : ""} ${t("navStandards").toLowerCase()}`}
            {hasActiveFilters && standards.length > 0 && (
              <span className="standards-total-context"> ({filtered.length} {t("of")} {standards.length} {t("total")})</span>
            )}
          </p>
          {hasActiveFilters && (
            <button type="button" className="library-reset-button" onClick={resetFilters}>
              {t("resetFilters")} <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="library-empty-state" role="status">{t("loadingStandards")}</div>
        ) : error ? (
          <div className="library-empty-state" role="alert">
            <h3>{t("unableStandards")}</h3>
            <p>{t("standardsUnavailable")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="library-empty-state">
            <span className="library-empty-icon" aria-hidden="true">⌕</span>
            <h3>{t("noStandards")}</h3>
            <p>{t("adjustFilters")}</p>
            <button type="button" className="primary-btn" onClick={resetFilters}>
              {t("resetFilters")}
            </button>
          </div>
        ) : (
          <>
            <motion.div className="standards-library-grid" layout>
              {visibleStandards.map((standard, index) => (
                <motion.div
                  key={standard.id}
                  layout
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.24, delay: shouldReduceMotion ? 0 : index * 0.025 }}
                >
                  <StandardCard standard={standard} />
                </motion.div>
              ))}
            </motion.div>
            <Pagination page={currentPage} pageCount={pageCount} onPageChange={updatePage} />
          </>
        )}
      </main>
    </div>
  );
}
