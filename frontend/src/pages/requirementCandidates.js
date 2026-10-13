const genericTerms = new Set([
  "a", "an", "and", "at", "by", "for", "from", "in", "is", "of", "on", "or", "the", "to",
  "standard", "specification", "indian", "requirement", "procure", "procurement", "need",
  "required", "applicable", "product", "material"
]);

function meaningfulTerms(value) {
  return new Set(
    String(value ?? "")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((term) => term.length > 2 && !genericTerms.has(term)) ?? []
  );
}

export function selectDefensibleCandidates(results, requirement, limit = 3) {
  if (!Array.isArray(results) || !Number.isInteger(limit) || limit < 1) return [];
  const requirementTerms = meaningfulTerms(requirement);
  if (requirementTerms.size === 0) return [];

  return results
    .map((item, index) => {
      const titleTerms = meaningfulTerms(item?.title);
      const scopeTerms = meaningfulTerms(item?.scopeSummary);
      const evidenceTerms = [...requirementTerms]
        .filter((term) => titleTerms.has(term) || scopeTerms.has(term));
      return {
        item,
        index,
        evidenceTerms,
        score: typeof item?.score === "number" && Number.isFinite(item.score) ? item.score : null
      };
    })
    .filter((candidate) =>
      typeof candidate.item?.isNumber === "string"
      && candidate.item.isNumber.trim()
      && typeof candidate.item?.title === "string"
      && candidate.item.title.trim()
      && candidate.evidenceTerms.length > 0
    )
    .sort((first, second) =>
      (second.score ?? Number.NEGATIVE_INFINITY) - (first.score ?? Number.NEGATIVE_INFINITY)
      || first.index - second.index
    )
    .slice(0, limit);
}

export function shouldShowCandidateWarning(analysis, candidateMode) {
  return Boolean(candidateMode && analysis?.status === "AMBIGUOUS");
}

export function isUnresolvedAnalysis(analysis) {
  return ["AMBIGUOUS", "UNCERTAIN", "UNSUPPORTED"].includes(analysis?.status);
}

export function isExplainableRecommendation(response) {
  return Boolean(
    response
    && response.assessment
    && ["CLEAR", "AMBIGUOUS", "UNCERTAIN", "UNSUPPORTED"].includes(response.assessment.status)
    && Array.isArray(response.candidates)
  );
}

export function selectExplainableCandidates(response) {
  return isExplainableRecommendation(response) ? response.candidates : [];
}

export function shouldShowExplainableWarning(response) {
  return isExplainableRecommendation(response) && isUnresolvedAnalysis(response.assessment);
}

export function getActiveRecommendationItems({
  explainableRecommendation,
  explainableCandidates,
  candidateWarningVisible,
  candidateResults,
  results
}) {
  if (explainableRecommendation) return explainableCandidates;
  if (candidateWarningVisible) return candidateResults;
  return results;
}

export function formatTenderTextForDisplay(text) {
  if (typeof text !== "string" || !text.trim()) return "";

  const paragraphs = [];
  let currentParagraph = "";
  let consecutiveBlankLines = 0;

  const finishParagraph = () => {
    if (currentParagraph) paragraphs.push(currentParagraph);
    currentParagraph = "";
  };

  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim().replace(/\s+/g, " ");
    if (!line) {
      consecutiveBlankLines += 1;
      continue;
    }

    const standaloneClauseNumber = line.match(/^(\d{1,3})[.)]?$/);
    const numberedClause = line.match(/^\d{1,3}[.)]\s+\S/);
    if (standaloneClauseNumber || numberedClause || consecutiveBlankLines > 1) {
      finishParagraph();
    }

    if (standaloneClauseNumber) {
      currentParagraph = `${standaloneClauseNumber[1]}.`;
    } else {
      currentParagraph = currentParagraph ? `${currentParagraph} ${line}` : line;
    }
    consecutiveBlankLines = 0;
  }

  finishParagraph();
  return paragraphs.join("\n\n");
}

export function tenderRequestErrorKey(error) {
  if (error?.status === 401 || error?.status === 403) return "sessionError";
  if (error?.status === 413) return "tenderTooLarge";
  if (error?.status === 400) return "tenderInvalidPdf";
  if (error?.status === 502) return "tenderAnalysisFailed";
  if (error?.code === "API_NETWORK_ERROR" || error?.code === "AUTH_API_NOT_CONFIGURED") {
    return "backendError";
  }
  return "tenderAnalysisFailed";
}
