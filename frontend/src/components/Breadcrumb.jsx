import { Link } from "react-router-dom";
import { useAuthText } from "./auth/AuthTextContext";

export default function Breadcrumb({ items }) {
  const t = useAuthText();
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {isCurrent || !item.to ? (
                <span aria-current={isCurrent ? "page" : undefined}>{item.label === "Home" ? t("home") : item.label === "Standards" ? t("navStandards") : item.label}</span>
              ) : (
                <Link to={item.to}>{item.label === "Home" ? t("home") : item.label === "Standards" ? t("navStandards") : item.label}</Link>
              )}
              {!isCurrent && <span className="breadcrumb-separator" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
