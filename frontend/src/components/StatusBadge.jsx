export default function StatusBadge({ children, className = "" }) {
  const label = String(children || "Not specified");
  const statusClass = /withdrawn|superseded|obsolete/i.test(label)
    ? "status-badge-inactive"
    : /current|active|reaffirmed/i.test(label)
      ? "status-badge-current"
      : "status-badge-neutral";

  return (
    <span className={`standard-status-badge ${statusClass} ${className}`.trim()} title={label}>
      {label}
    </span>
  );
}
