import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { displayValue, loadStandards, splitRelatedStandards } from "../data/standards";

function DetailItem({ label, value }) {
  let shownValue = displayValue(value);
  if (label === "Amendment Count" && shownValue !== "Not specified" && !/^\d+(?:\s+amendments?)?$/i.test(shownValue)) {
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
  const { id = "" } = useParams();
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
            { label: "Home", to: "/" },
            { label: "Standards", to: "/standards" },
            { label: standard?.id || id || "Standard details" }
          ]}
        />

        {loading ? (
          <div className="library-empty-state" role="status">Loading standard details…</div>
        ) : error ? (
          <div className="library-empty-state" role="alert">
            <h1>Standard details could not be loaded</h1>
            <p>{error}</p>
            <Link to="/standards" className="primary-btn">Back to Standards</Link>
          </div>
        ) : !standard ? (
          <div className="library-empty-state">
            <h1>Standard not found</h1>
            <p>This standard is not part of the current library.</p>
            <Link to="/standards" className="primary-btn">Browse Standards</Link>
          </div>
        ) : (
          <>
            <Link to="/standards" className="back-link">← Back to Standards</Link>
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
                    STANDARD OVERVIEW
                  </span>
                  <div className="standard-details-grid">
                    <DetailItem label="IS Number" value={standard.is_number} />
                    <DetailItem label="Category" value={standard.category} />
                    <DetailItem label="Edition Year" value={standard.edition_year} />
                    <DetailItem label="Status" value={standard.status} />
                    <DetailItem label="Superseding IS" value={standard.superseding_is} />
                    <DetailItem label="Amendment Count" value={standard.amendment_count} />
                    <DetailItem label="Latest Amendment Note" value={standard.latest_amendment_note} />
                    <DetailItem label="Verification Status" value={standard.verification_status} />
                  </div>
                </section>

                <section className="info-section">
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    CERTIFICATION & COMPLIANCE
                  </span>
                  <div className="standard-details-grid">
                    <DetailItem label="Certification Status" value={standard.certification_status} />
                    <DetailItem label="Certification Type" value={standard.certification_type} />
                    <DetailItem label="QCO Reference" value={standard.qco_reference} />
                  </div>
                </section>

                <section className="info-section">
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    RELATED STANDARDS
                  </span>
                  {relatedStandards.length === 0 ? (
                    <p className="related-empty">Not specified</p>
                  ) : (
                    <ul className="related-standards-list">
                      {relatedStandards.map(({ label, match }) => (
                        <li key={label}>
                          {match ? (
                            <Link to={`/standards/${encodeURIComponent(match.id)}`}>
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
                  <h3>Procurement Intelligence</h3>
                  <p>
                    Use this standard as part of your procurement research and validate the latest applicability against authoritative sources before making a decision.
                  </p>
                  <Link to="/standards" className="primary-btn full-width">Explore all standards</Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
