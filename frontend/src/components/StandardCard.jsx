import { Link } from "react-router-dom";
import { displayValue } from "../data/standards";
import StatusBadge from "./StatusBadge";
import { useAuthText } from "./auth/AuthTextContext";

export default function StandardCard({ standard }) {
  const t = useAuthText();
  return (
    <article className="standard-card-motion-wrap">
      <Link
        to={`/standards/${encodeURIComponent(standard.id)}`}
        className="standard-library-card"
        aria-label={`View details for ${standard.id}, ${standard.title}`}
      >
        <div className="standard-card-heading">
          <span className="standard-card-id">{standard.id}</span>
          <StatusBadge className="standard-card-status">{displayValue(standard.status)}</StatusBadge>
        </div>
        <h2>{standard.title}</h2>
        <div className="standard-card-metadata">
          <div>
            <span>{t("category")}</span>
            <strong>{displayValue(standard.category)}</strong>
          </div>
          <div>
            <span>{t("edition")}</span>
            <strong>{displayValue(standard.edition_year)}</strong>
          </div>
        </div>
        <div className="standard-card-certification">
          <span className="certification-mark" aria-hidden="true">✓</span>
          <div>
          <span>{t("certification")}</span>
            <strong>{displayValue(standard.certification_status)}</strong>
          </div>
        </div>
        <div className="standard-card-footer">
          <span>{t("viewDetails")}</span>
          <span className="standard-card-arrow" aria-hidden="true">→</span>
        </div>
      </Link>
    </article>
  );
}
