import { useAuthText } from "./auth/AuthTextContext";

export default function Pagination({ page, pageCount, onPageChange }) {
  const t = useAuthText();
  if (pageCount <= 1) return null;

  return (
    <nav className="standards-pagination" aria-label="Standards pages">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        {t("previous")}
      </button>
      <div className="pagination-pages">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
            aria-label={`Page ${pageNumber}`}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>
        {t("next")}
      </button>
    </nav>
  );
}
