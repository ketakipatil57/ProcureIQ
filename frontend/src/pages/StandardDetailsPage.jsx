import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { displayValue, loadStandards, splitRelatedStandards } from "../data/standards";
import { useAuthText } from "../components/auth/AuthTextContext";

function DetailItem({ label, value }) {
  const t = useAuthText();
  let shownValue = displayValue(value);
  if (shownValue === "Not specified") shownValue = t("notSpecified");
  if (label === t("amendmentCount") && shownValue !== t("notSpecified") && !/^\d+(?:\s+amendments?)?$/i.test(shownValue)) {
    shownValue = "Not stated in source";
  }

  return (
    <div className="standard-detail-item">
      <span>{label}</span>
      <strong>{shownValue}</strong>
    </div>
  );
}

export default function StandardDetailsPage() {
  const t = useAuthText();
  const { id = "" } = useParams();
  const location = useLocation();
  const fromRecommendations = Boolean(location.state?.fromRecommendations);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const standard = useMemo(
    () => standards.find((item) => item.id.toLowerCase() === id.toLowerCase()),
    [standards, id]
  );
  const relatedStandards = useMemo(() => {
    if (!standard) return [];
    const candidates = [
      ...splitRelatedStandards(standard.related_standards),
      ...splitRelatedStandards(standard.qco_reference)
    ];
    const seen = new Set();
    return candidates.flatMap((label) => {
      const match = standards.find((item) => item.id.toLowerCase() === label.toLowerCase());
      if (match) {
        if (seen.has(match.id)) return [];
        seen.add(match.id);
        return [{ label: match.id, match }];
      }
      if (/^IS[\s-]/i.test(label) && !seen.has(label.toLowerCase())) {
        seen.add(label.toLowerCase());
        return [{ label, match: null }];
      }
      return [];
    });
  }, [standard, standards]);

  return (
    <div className="page-shell standards-shell">
      <Navbar />
      <main className="container details-page standards-details-page">
        <Breadcrumb
          items={[
            { label: t("home"), to: "/" },
            { label: t("navStandards"), to: "/standards" },
            { label: standard?.id || id || "Standard details" }
          ]}
        />

        {fromRecommendations && (
          <Link to="/dashboard" state={{ fromRecommendations: true }} className="back-link">
            ← Back to Results
          </Link>
        )}

        {loading ? (
          <div className="library-empty-state" role="status">{t("loadingStandards")}</div>
        ) : error ? (
          <div className="library-empty-state" role="alert">
            <h1>{t("detailsLoadError")}</h1>
            <p>{t("standardsUnavailable")}</p>
            <Link to="/standards" className="primary-btn">Back to Standards</Link>
          </div>
        ) : !standard ? (
          <div className="library-empty-state">
            <h1>{t("notFound")}</h1>
            <p>This standard is not part of the current library.</p>
            <Link to="/standards" className="primary-btn">{t("browseStandards")}</Link>
          </div>
        ) : (
          <>
            {!fromRecommendations && (
              <Link to="/standards" className="back-link">← {t("backStandards")}</Link>
            )}
            <section className="details-header-card">
              <div className="details-header-copy">
                <span className="standard-number large">{standard.id}</span>
                <h1>{standard.title}</h1>
                <p>{displayValue(standard.scope_summary)}</p>
              </div>
              <div className="detail-status-box">
                <StatusBadge className="large-badge">{displayValue(standard.status)}</StatusBadge>
              </div>
            </section>

            <div className="details-grid">
              <div className="details-main">
                <section className="info-section">
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    {t("overview")}
                  </span>
                  <div className="standard-details-grid">
                    <DetailItem label={t("isNumber")} value={standard.is_number} />
                    <DetailItem label={t("category")} value={standard.category} />
                    <DetailItem label={t("editionYear")} value={standard.edition_year} />
                    <DetailItem label={t("status")} value={standard.status} />
                    <DetailItem label={t("superseding")} value={standard.superseding_is} />
                    <DetailItem label={t("amendmentCount")} value={standard.amendment_count} />
                    <DetailItem label={t("latestAmendment")} value={standard.latest_amendment_note} />
                    <DetailItem label={t("verification")} value={standard.verification_status} />
                  </div>
                </section>

                <section className="info-section">
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    {t("certificationCompliance")}
                  </span>
                  <div className="standard-details-grid">
                    <DetailItem label={t("certificationStatus")} value={standard.certification_status} />
                    <DetailItem label={t("certificationType")} value={standard.certification_type} />
                    <DetailItem label={t("qcoReference")} value={standard.qco_reference} />
                  </div>
                </section>

                <section className="info-section">
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    {t("relatedStandards")}
                  </span>
                  {relatedStandards.length === 0 ? (
                    <p className="related-empty">{t("notSpecified")}</p>
                  ) : (
                    <ul className="related-standards-list">
                      {relatedStandards.map(({ label, match }) => (
                        <li key={label}>
                          {match ? (
                            <Link to={`/standards/${encodeURIComponent(match.id)}`} state={location.state}>
                              <span>{match.id}</span>
                              <span aria-hidden="true">→</span>
                            </Link>
                          ) : (
                            <span className="related-standard-unavailable">
                              {label}<small>Not in this library</small>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <aside className="details-side">
                <div className="verification-card standard-verification-card">
                  <div className="verification-icon">✓</div>
                  <h3>{t("procurementIntelligence")}</h3>
                  <p>{t("procurementResearch")}</p>
                  <Link to="/standards" className="primary-btn full-width">{t("exploreAll")}</Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
