import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveRecommendationItems,
  formatTenderTextForDisplay,
  isExplainableRecommendation,
  isUnresolvedAnalysis,
  selectDefensibleCandidates,
  selectExplainableCandidates,
  shouldShowCandidateWarning,
  shouldShowExplainableWarning,
  tenderRequestErrorKey
} from "./requirementCandidates.js";

test("limits candidates to three and preserves semantic score ranking", () => {
  const results = [
    { isNumber: "IS 1", title: "Cement specification", scopeSummary: "cement", score: 0.71 },
    { isNumber: "IS 2", title: "Construction cement", scopeSummary: "cement for construction", score: 0.92 },
    { isNumber: "IS 3", title: "Cement product", scopeSummary: "cement", score: 0.83 },
    { isNumber: "IS 4", title: "Cement and concrete", scopeSummary: "cement", score: 0.65 }
  ];

  assert.deepEqual(
    selectDefensibleCandidates(results, "Cement for construction").map(({ item }) => item.isNumber),
    ["IS 2", "IS 3", "IS 1"]
  );
});

test("uses exact shared title or scope terms as evidence and excludes unsupported matches", () => {
  const candidates = selectDefensibleCandidates([
    { isNumber: "IS 1", title: "Cement specification", scopeSummary: "physical requirements", score: 0.9 },
    { isNumber: "IS 2", title: "Aggregate standard", scopeSummary: "grading of aggregates", score: 0.95 }
  ], "cement");

  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].evidenceTerms, ["cement"]);
});

test("returns fewer than two candidates when the available metadata has no defensible overlap", () => {
  const candidates = selectDefensibleCandidates([
    { isNumber: "IS 1", title: "Aggregate grading", scopeSummary: "coarse and fine aggregates", score: 0.94 }
  ], "industrial helmet");

  assert.deepEqual(candidates, []);
});

test("retains missing metadata without inventing values and permits fewer than two candidates", () => {
  const candidate = {
    isNumber: "IS 1",
    title: "Cement specification",
    scopeSummary: null,
    score: 0.75,
    editionYear: null,
    status: null,
    certificationStatus: null
  };

  const candidates = selectDefensibleCandidates([candidate], "cement");

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].item.scopeSummary, null);
  assert.equal(candidates[0].item.editionYear, null);
  assert.equal(candidates[0].item.status, null);
  assert.equal(candidates[0].item.certificationStatus, null);
});

test("keeps candidate warning only for unresolved ambiguous continuation", () => {
  assert.equal(shouldShowCandidateWarning({ status: "AMBIGUOUS" }, true), true);
  assert.equal(shouldShowCandidateWarning({ status: "CLEAR" }, true), false);
  assert.equal(shouldShowCandidateWarning({ status: "AMBIGUOUS" }, false), false);
  assert.equal(isUnresolvedAnalysis({ status: "AMBIGUOUS" }), true);
  assert.equal(isUnresolvedAnalysis({ status: "UNCERTAIN" }), true);
  assert.equal(isUnresolvedAnalysis({ status: "UNSUPPORTED" }), true);
  assert.equal(isUnresolvedAnalysis({ status: "CLEAR" }), false);
});

test("accepts the C3 response shape and exposes backend-returned candidate evidence without fabricating fields", () => {
  const response = {
    assessment: { status: "AMBIGUOUS" },
    matchingQuery: "cement, clarified",
    statusExplanation: "Candidates remain provisional.",
    candidateResultsProvisional: true,
    candidates: [{
      rank: 2,
      standard: { isNumber: "IS 269:2015", title: "Cement", score: 0.83 },
      retrievalExplanation: "Returned by semantic matching.",
      scoreMeaning: "SEMANTIC_SIMILARITY_NOT_PROBABILITY",
      applicabilityVerified: false,
      metadataEvidence: [],
      knownAnswerEvidence: [],
      unresolvedMaterialDetails: []
    }]
  };

  assert.equal(isExplainableRecommendation(response), true);
  assert.deepEqual(selectExplainableCandidates(response), response.candidates);
  assert.equal(response.candidates[0].standard.editionYear, undefined);
  assert.equal(response.candidates[0].metadataEvidence.length, 0);
});

test("shows C3 warning for each unresolved status and removes it only for CLEAR", () => {
  for (const status of ["AMBIGUOUS", "UNCERTAIN", "UNSUPPORTED"]) {
    assert.equal(shouldShowExplainableWarning({
      assessment: { status },
      candidates: []
    }), true);
  }
  assert.equal(shouldShowExplainableWarning({
    assessment: { status: "CLEAR" },
    candidates: []
  }), false);
});

test("does not accept malformed C3 responses as recommendation results", () => {
  assert.equal(isExplainableRecommendation({ assessment: { status: "CLEAR" }, candidates: null }), false);
  assert.deepEqual(selectExplainableCandidates(null), []);
  assert.equal(shouldShowExplainableWarning({ assessment: { status: "UNKNOWN" }, candidates: [] }), false);
});

test("uses the active C3 candidate list for the displayed match count, including zero candidates", () => {
  const staleLegacyResults = [{ isNumber: "IS stale", title: "Legacy result" }];
  const noCandidates = getActiveRecommendationItems({
    explainableRecommendation: true,
    explainableCandidates: [],
    candidateWarningVisible: false,
    candidateResults: [],
    results: staleLegacyResults
  });
  assert.deepEqual(noCandidates, []);
  assert.equal(noCandidates.length, 0);

  const cableCandidates = [{ rank: 1, standard: { isNumber: "IS 694:2010" } }];
  const activeCandidates = getActiveRecommendationItems({
    explainableRecommendation: true,
    explainableCandidates: cableCandidates,
    candidateWarningVisible: false,
    candidateResults: [],
    results: staleLegacyResults
  });
  assert.equal(activeCandidates.length, 1);
  assert.equal(activeCandidates[0].standard.isNumber, "IS 694:2010");
});

test("keeps tender authorization errors separate from extraction failures", () => {
  assert.equal(tenderRequestErrorKey({ status: 403 }), "sessionError");
  assert.equal(tenderRequestErrorKey({ status: 401 }), "sessionError");
  assert.equal(tenderRequestErrorKey({ status: 502 }), "tenderAnalysisFailed");
  assert.equal(tenderRequestErrorKey({ code: "API_NETWORK_ERROR" }), "backendError");
});

test("formats extracted one-word lines into numbered tender clauses without rewriting content", () => {
  const extractedText = [
    "Compliance",
    "declaration",
    "against",
    "applicable",
    "Indian",
    "Standards",
    "6",
    "The",
    "supplier",
    "shall",
    "submit",
    "a",
    "compliance",
    "declaration.",
    "7.",
    "The",
    "cable",
    "shall",
    "meet",
    "the",
    "stated",
    "voltage.",
    "",
    "",
    "Annexure",
    "A"
  ].join("\n");

  assert.equal(
    formatTenderTextForDisplay(extractedText),
    "Compliance declaration against applicable Indian Standards\n\n"
      + "6. The supplier shall submit a compliance declaration.\n\n"
      + "7. The cable shall meet the stated voltage.\n\n"
      + "Annexure A"
  );
});
