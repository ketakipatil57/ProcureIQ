const missingValues = new Set(["", "N/A", "NA", "NULL", "NONE"]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("Standards data contains an unterminated CSV field.");
  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }

  const [headers, ...records] = rows;
  if (!headers?.length) throw new Error("Standards data is empty.");

  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] ?? "").trim()]))
  );
}

let standardsRequest;

export function loadStandards() {
  if (!standardsRequest) {
    standardsRequest = fetch(`${import.meta.env.BASE_URL}data/standards.csv`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load standards data (${response.status}).`);
        return response.text();
      })
      .then((csv) =>
        parseCsv(csv).map((row) => ({
          ...row,
          id: row.is_number,
          year: row.edition_year,
          description: row.scope_summary
        }))
      );
  }

  return standardsRequest;
}

export function displayValue(value) {
  const normalized = String(value ?? "").trim();
  if (missingValues.has(normalized.toUpperCase())) return "Not specified";
  if (normalized.toUpperCase() === "NONE_IDENTIFIED") return "None identified";
  if (normalized.toUpperCase() === "NOT_APPLICABLE") return "Not applicable";
  if (normalized.toUpperCase() === "NOT_STATED_IN_SOURCE") return "Not stated in source";
  return normalized.replaceAll("_", " ");
}

export function splitRelatedStandards(value) {
  return String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}
