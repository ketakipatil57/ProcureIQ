import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { apiRequest } from "../services/apiClient";
import { PreferenceControls } from "../components/AppPreferences";
import ProcureIQLogo from "../components/ProcureIQLogo";
import { useAuthText } from "../components/auth/AuthTextContext";
import { requirementAnalysisKeyMap } from "../components/requirementWorkflowTranslations";
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
} from "./requirementCandidates";

const quickActions = [
  { label: "searchButton", icon: "⌕", to: "/standards" },
  { label: "browseStandards", icon: "▣", to: "/standards" },
  { label: "uploadTender", icon: "↑", to: "/dashboard" },
  { label: "viewCertifications", icon: "✓", to: "/about" }
];

const recentSearches = [
  "Road construction cement",
  "Electrical safety equipment",
  "Packaging material standards"
];

const RECOMMENDATION_STATE_KEY = "procureiq_recommendation_state";

function loadRecommendationState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(RECOMMENDATION_STATE_KEY));
    if (
      state?.version !== 1
      || typeof state.query !== "string"
      || !Array.isArray(state.results)
      || !["text", "pdf"].includes(state.mode)
      || !state.results.every((item) => item && typeof item === "object" && typeof item.title === "string")
    ) {
      return null;
    }

    return {
      query: state.query,
      results: state.results,
      mode: state.mode,
      selectedFileName: typeof state.selectedFileName === "string" ? state.selectedFileName : "",
      requirementAnalysis: state.requirementAnalysis
        && ["CLEAR", "AMBIGUOUS", "UNSUPPORTED", "UNCERTAIN"].includes(state.requirementAnalysis.status)
        ? state.requirementAnalysis
        : null,
      candidateMode: state.candidateMode === true && state.requirementAnalysis?.status === "AMBIGUOUS",
      explainableRecommendation: isExplainableRecommendation(state.explainableRecommendation)
        ? state.explainableRecommendation
        : null,
      tenderReport: state.tenderReport
        && ["SUCCESS", "EMPTY", "TOO_LONG", "FAILED"].includes(state.tenderReport.extractionStatus)
        ? state.tenderReport
        : null,
      candidateQuery: typeof state.candidateQuery === "string" ? state.candidateQuery : state.query,
      questionCatalog: state.questionCatalog && typeof state.questionCatalog === "object"
        && !Array.isArray(state.questionCatalog)
        ? Object.fromEntries(Object.entries(state.questionCatalog).filter(([, question]) =>
          question && typeof question.id === "string" && Array.isArray(question.options)))
        : {},
      clarificationDraft: state.clarificationDraft && typeof state.clarificationDraft === "object"
        && !Array.isArray(state.clarificationDraft)
        ? Object.fromEntries(Object.entries(state.clarificationDraft).filter(([, answer]) =>
          answer && typeof answer.optionId === "string" && typeof answer.otherText === "string"))
        : {}
    };
  } catch {
    return null;
  }
}

function saveRecommendationState(state) {
  try {
    sessionStorage.setItem(RECOMMENDATION_STATE_KEY, JSON.stringify({ version: 1, ...state }));
  } catch {
    // If session storage is unavailable, the dashboard still works in memory.
  }
}

function getDashboardGreeting(t) {
  const storedUser = localStorage.getItem("procureiq_user");
  if (!storedUser) return t("helloThere");

  try {
    const user = JSON.parse(storedUser);
    const name = user.name
      || user.username
      || user.email?.split("@")[0];

    return name
      ? `${t("greetingPrefix")} ${name}`
      : t("helloThere");
  } catch {
    return t("helloThere");
  }
}

export default function UserDashboard() {
  const t = useAuthText();
  const fileInputRef = useRef(null);
  const tenderFileInputRef = useRef(null);
  const [restoredState] = useState(loadRecommendationState);
  const initialQuestionCatalog = restoredState?.questionCatalog ?? {};
  const [query, setQuery] = useState(() => restoredState?.query ?? "");
  const [results, setResults] = useState(() => restoredState?.results ?? []);
  const [analysis, setAnalysis] = useState(() => restoredState?.requirementAnalysis ?? null);
  const [explainableRecommendation, setExplainableRecommendation] = useState(
    () => restoredState?.explainableRecommendation ?? null
  );
  const [tenderReport, setTenderReport] = useState(() => restoredState?.tenderReport ?? null);
  const [referenceAuditText, setReferenceAuditText] = useState(
    () => restoredState?.tenderReport?.extractedText ?? ""
  );
  const [referenceAudit, setReferenceAudit] = useState(null);
  const [referenceAuditLoading, setReferenceAuditLoading] = useState(false);
  const [referenceAuditError, setReferenceAuditError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingAttempted, setMatchingAttempted] = useState(Boolean(restoredState?.results?.length || restoredState?.candidateMode));
  const [candidateMode, setCandidateMode] = useState(() => restoredState?.candidateMode ?? false);
  const [candidateQuery, setCandidateQuery] = useState(() => restoredState?.candidateQuery ?? restoredState?.query ?? "");
  const questionCatalogRef = useRef(initialQuestionCatalog);
  const [questionCatalog, setQuestionCatalog] = useState(() => initialQuestionCatalog);
  const initialAnswerDraft = restoredState?.clarificationDraft
    ?? Object.fromEntries((restoredState?.requirementAnalysis?.providedAnswers ?? []).map((answer) => [
      answer.questionId,
      { optionId: answer.optionId, otherText: answer.otherText ?? "" }
    ]));
  const answerDraftRef = useRef(initialAnswerDraft);
  const [answersDraft, setAnswersDraft] = useState(() => initialAnswerDraft);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [wordingConfirmed, setWordingConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tenderAnalyzing, setTenderAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState(() => restoredState?.selectedFileName ?? "");
  const [searchError, setSearchError] = useState("");
  const greeting = getDashboardGreeting(t);
  const originalRequirement = analysis?.originalRequirement || "";
  const interpretedRequirement = analysis?.interpretedRequirement || originalRequirement;
  const showInterpretedRequirement = Boolean(
    analysis && interpretedRequirement !== originalRequirement
  );
  const formatRequirementForReview = (requirement) => tenderReport
    ? formatTenderTextForDisplay(requirement)
    : requirement;

  function recordAnalysis(data, report = tenderReport) {
    setAnalysis(data);
    setExplainableRecommendation(null);
    setAnalysisError("");
    setWordingConfirmed(false);
    setQuestionnaireOpen(false);
    const nextQuestionCatalog = {
      ...questionCatalogRef.current,
      ...Object.fromEntries((data?.clarificationQuestions ?? []).map((question) => [question.id, question]))
    };
    questionCatalogRef.current = nextQuestionCatalog;
    setQuestionCatalog(nextQuestionCatalog);
    const nextAnswerDraft = Object.fromEntries((data?.providedAnswers ?? []).map((answer) => [
      answer.questionId,
      { optionId: answer.optionId, otherText: answer.otherText ?? "" }
    ]));
    answerDraftRef.current = nextAnswerDraft;
    setAnswersDraft(nextAnswerDraft);
    setCandidateMode(false);
    saveRecommendationState({
      query: data.originalRequirement,
      results: [],
      mode: "text",
      selectedFileName: report?.fileName ?? "",
      requirementAnalysis: data,
      explainableRecommendation: null,
      tenderReport: report,
      candidateMode: false,
      candidateQuery: data.originalRequirement,
      questionCatalog: nextQuestionCatalog,
      clarificationDraft: nextAnswerDraft
    });
  }

  function analysisErrorMessage(error) {
    if (error.status === 401 || error.status === 403) return t("sessionError");
    if (error.status === 400) return t("validationError");
    if (error.status === 502) return t("serviceError");
    if (error.code === "API_NETWORK_ERROR" || error.code === "AUTH_API_NOT_CONFIGURED") return t("backendError");
    return t("requirementAnalysisError");
  }

  async function runRecommendations(requirement, {
    mode = "text",
    fileName = "",
    displayQuery = requirement,
    showCandidates = false,
    analysisSnapshot = analysis,
    tenderReportSnapshot = tenderReport
  } = {}) {
    setMatchingLoading(true);
    setMatchingAttempted(true);
    setCandidateMode(showCandidates);
    setCandidateQuery(requirement);
    setSearchError("");

    try {
      const data = await apiRequest("/recommendations", {
        method: "POST",
        body: JSON.stringify({ query: requirement })
      });
      const nextResults = Array.isArray(data?.results) ? data.results : [];
      setResults(nextResults);
      setUploadError("");
      saveRecommendationState({
        query: displayQuery,
        results: nextResults,
        mode,
        selectedFileName: fileName,
        requirementAnalysis: analysisSnapshot,
        explainableRecommendation: null,
        tenderReport: mode === "pdf" ? null : tenderReportSnapshot,
        candidateMode: showCandidates,
        candidateQuery: requirement,
        questionCatalog: questionCatalogRef.current,
        clarificationDraft: answerDraftRef.current
      });
    } catch (error) {
      setResults([]);
      setMatchingAttempted(false);
      if (error.status === 401 || error.status === 403) {
        setSearchError(t("sessionError"));
      } else if (error.status === 400) {
        setSearchError(t("validationError"));
      } else if (error.status === 502) {
        setSearchError(t("serviceError"));
      } else if (error.code === "API_NETWORK_ERROR") {
        setSearchError(t("backendError"));
      } else {
        setSearchError(t("genericError"));
      }
    } finally {
      setMatchingLoading(false);
    }
  }

  async function searchStandards() {
    const requirement = query.trim();
    if (!requirement) return;

    setAnalysisLoading(true);
    setAnalysis(null);
    setAnalysisError("");
    setResults([]);
    setExplainableRecommendation(null);
    setTenderReport(null);
    setMatchingAttempted(false);
    setSearchError("");
    setSelectedFileName("");
    setUploadError("");
    questionCatalogRef.current = {};
    answerDraftRef.current = {};
    setQuestionCatalog({});
    setAnswersDraft({});
    setQuestionnaireOpen(false);

    try {
      const data = await apiRequest("/requirements/analyze", {
        method: "POST",
        body: JSON.stringify({ requirement })
      });
      if (!data || !["CLEAR", "AMBIGUOUS", "UNSUPPORTED", "UNCERTAIN"].includes(data.status)) {
        throw new Error("The requirement analysis response was incomplete.");
      }
      recordAnalysis(data, null);
      if (data?.status === "CLEAR") {
        await runRecommendations(requirement, {
          analysisSnapshot: data,
          tenderReportSnapshot: null
        });
      }
    } catch (error) {
      setAnalysisError(analysisErrorMessage(error));
    } finally {
      setAnalysisLoading(false);
    }
  }

  function beginClarification() {
    setQuestionnaireOpen(true);
  }

  function updateAnswer(questionId, optionId, otherText = "") {
    const nextAnswers = {
      ...answerDraftRef.current,
      [questionId]: { optionId, otherText: optionId ? otherText : "" }
    };
    answerDraftRef.current = nextAnswers;
    setAnswersDraft(nextAnswers);
    if (analysis) {
      setExplainableRecommendation(null);
      setResults([]);
      setMatchingAttempted(false);
      saveRecommendationState({
        query: analysis.originalRequirement,
        results: [],
        mode: "text",
        selectedFileName: "",
        requirementAnalysis: analysis,
        explainableRecommendation: null,
        tenderReport,
        candidateMode,
        candidateQuery,
        questionCatalog: questionCatalogRef.current,
        clarificationDraft: nextAnswers
      });
    }
  }

  async function reassessRequirement() {
    if (!analysis) return;
    setAnalysisLoading(true);
    setAnalysisError("");
    setResults([]);
    setMatchingAttempted(false);
    setCandidateMode(false);
    setExplainableRecommendation(null);

    const answers = Object.entries(answerDraftRef.current)
      .filter(([, answer]) => answer?.optionId)
      .map(([questionId, answer]) => ({
        questionId,
        optionId: answer.optionId,
        ...(answer.otherText ? { otherText: answer.otherText } : {})
      }));
    saveRecommendationState({
      query: analysis.originalRequirement,
      results: [],
      mode: "text",
      selectedFileName: "",
      requirementAnalysis: analysis,
      explainableRecommendation: null,
      tenderReport,
      candidateMode: false,
      candidateQuery: analysis.originalRequirement,
      questionCatalog: questionCatalogRef.current,
      clarificationDraft: answerDraftRef.current
    });

    try {
      const data = await apiRequest("/requirements/recommendations", {
        method: "POST",
        body: JSON.stringify({ requirement: analysis.originalRequirement, answers })
      });
      if (!isExplainableRecommendation(data)) {
        throw new Error("The explainable recommendation response was incomplete.");
      }
      recordAnalysis(data.assessment, data);
      setExplainableRecommendation(data);
      setResults([]);
      setCandidateMode(false);
      setCandidateQuery(data.matchingQuery || data.assessment.originalRequirement || analysis.originalRequirement);
      setMatchingAttempted(true);
      saveRecommendationState({
        query: data.assessment.originalRequirement || analysis.originalRequirement,
        results: [],
        mode: "text",
        selectedFileName: "",
        requirementAnalysis: data.assessment,
        explainableRecommendation: data,
        tenderReport,
        candidateMode: false,
        candidateQuery: data.matchingQuery || data.assessment.originalRequirement || analysis.originalRequirement,
        questionCatalog: questionCatalogRef.current,
        clarificationDraft: answerDraftRef.current
      });
    } catch (error) {
      setAnalysisError(analysisErrorMessage(error));
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function continueToMatching(requirement) {
    setQuestionnaireOpen(false);
    setExplainableRecommendation(null);
    await runRecommendations(requirement, {
      displayQuery: analysis?.originalRequirement ?? requirement,
      showCandidates: analysis?.status === "AMBIGUOUS",
      analysisSnapshot: analysis
    });
  }

  function localizedAnalysisKey(key, fallback = "") {
    if (!key) return fallback;
    const translated = t(requirementAnalysisKeyMap[key] ?? key);
    return translated === key || translated === requirementAnalysisKeyMap[key] ? fallback || key : translated;
  }

  function localizedReason(reason) {
    const explanation = localizedAnalysisKey(reason.explanationKey);
    return explanation || reason.explanation || t("requirementNotAvailable");
  }

  function statusLabel(status) {
    const key = {
      CLEAR: "requirementStatusClear",
      AMBIGUOUS: "requirementStatusAmbiguous",
      UNSUPPORTED: "requirementStatusUnsupported",
      UNCERTAIN: "requirementStatusUncertain"
    }[status];
    return key ? t(key) : status;
  }

  function statusExplanation(status) {
    const key = {
      CLEAR: "requirementClearExplanation",
      AMBIGUOUS: "requirementAmbiguousExplanation",
      UNSUPPORTED: "requirementUnsupportedExplanation",
      UNCERTAIN: "requirementUncertainExplanation"
    }[status];
    return key ? t(key) : "";
  }

  function informationStatusLabel(status) {
    const key = {
      KNOWN: "requirementKnown",
      UNKNOWN: "requirementUnknownStatus",
      UNANSWERED: "requirementUnanswered",
      UNRESOLVED: "requirementUnresolved"
    }[status];
    return key ? t(key) : status;
  }

  function standardReferenceVerificationText(status) {
    const key = {
      FOUND_IN_DATABASE: "requirementReferenceFound",
      NOT_FOUND_IN_DATABASE: "requirementReferenceNotFound",
      UNVERIFIED: "requirementReferenceNotChecked"
    }[status];
    return key ? t(key) : t("requirementReferenceNotChecked");
  }

  function getQuestionnaireQuestions() {
    const questions = [
      ...Object.values(questionCatalog),
      ...(analysis?.clarificationQuestions ?? []),
      ...(analysis?.providedAnswers ?? [])
        .map((answer) => questionCatalog[answer.questionId])
        .filter(Boolean)
    ];
    return [...new Map(questions.map((question) => [question.id, question])).values()];
  }

  function startDirectMatching() {
    return continueToMatching(analysis.originalRequirement);
  }

  function startRefinedMatching() {
    return reassessRequirement();
  }

  const candidateWarningVisible = shouldShowCandidateWarning(analysis, candidateMode);
  const candidateResults = candidateWarningVisible
    ? selectDefensibleCandidates(results, candidateQuery, 3)
    : [];
  const explainableCandidates = selectExplainableCandidates(explainableRecommendation);
  const explainableWarningVisible = shouldShowExplainableWarning(explainableRecommendation);
  const recommendationWarningVisible = candidateWarningVisible || explainableWarningVisible;
  const activeRecommendationItems = getActiveRecommendationItems({
    explainableRecommendation,
    explainableCandidates,
    candidateWarningVisible,
    candidateResults,
    results
  });
  const analysisWarningVisible = isUnresolvedAnalysis(analysis);

  async function uploadTender(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }

    setSelectedFileName(file.name);
    setUploadError("");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("The selected file must be a PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("The PDF must be 10 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setMatchingAttempted(true);
    setAnalysis(null);
    setAnalysisError("");
    setExplainableRecommendation(null);
    setTenderReport(null);
    questionCatalogRef.current = {};
    answerDraftRef.current = {};
    setQuestionCatalog({});
    setAnswersDraft({});
    setCandidateMode(false);
    setUploading(true);

    try {
      const data = await apiRequest("/recommendations/pdf", {
        method: "POST",
        body: formData
      });
      const nextResults = Array.isArray(data?.results) ? data.results : [];
      setResults(nextResults);
      saveRecommendationState({ query, results: nextResults, mode: "pdf", selectedFileName: file.name });
      setSearchError("");
      setAnalysis(null);
      setAnalysisError("");
    } catch (error) {
      setResults([]);
      if (error.status === 400) {
        setUploadError("The PDF could not be processed. Please check the file and try again.");
      } else if (error.status === 401 || error.status === 403) {
        setUploadError(t("sessionError"));
      } else if (error.status === 413) {
        setUploadError("The PDF must be 10 MB or smaller.");
      } else if (error.status === 502) {
        setUploadError(t("serviceError"));
      } else if (error.code === "API_NETWORK_ERROR" || error.code === "AUTH_API_NOT_CONFIGURED") {
        setUploadError(t("backendError"));
      } else {
        setUploadError(t("genericError"));
      }
    } finally {
      setUploading(false);
    }
  }

  async function analyzeTender(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      setUploadError(t("tenderSelectPdf"));
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError(t("tenderInvalidPdf"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t("tenderTooLarge"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setTenderAnalyzing(true);
    setTenderReport(null);
    setReferenceAuditText("");
    setReferenceAudit(null);
    setReferenceAuditError("");
    setAnalysis(null);
    setExplainableRecommendation(null);
    setResults([]);
    setAnalysisError("");
    setUploadError("");
    setMatchingAttempted(false);
    setSelectedFileName(file.name);
    questionCatalogRef.current = {};
    answerDraftRef.current = {};
    setQuestionCatalog({});
    setAnswersDraft({});
    setQuestionnaireOpen(false);

    try {
      const data = await apiRequest("/requirements/tender-analysis", {
        method: "POST",
        body: formData
      });
      if (!data || !["SUCCESS", "EMPTY", "TOO_LONG", "FAILED"].includes(data.extractionStatus)) {
        throw new Error("The tender analysis response was incomplete.");
      }
      setTenderReport(data);
      setSelectedFileName(data.fileName || file.name);
      setReferenceAuditText(typeof data.extractedText === "string" ? data.extractedText : "");
      if (data.assessment) {
        if (!["CLEAR", "AMBIGUOUS", "UNSUPPORTED", "UNCERTAIN"].includes(data.assessment.status)) {
          throw new Error("The tender assessment response was incomplete.");
        }
        recordAnalysis(data.assessment);
        setTenderReport(data);
        setSelectedFileName(data.fileName || file.name);
        saveRecommendationState({
          query: data.assessment.originalRequirement,
          results: [],
          mode: "text",
          selectedFileName: data.fileName || file.name,
          requirementAnalysis: data.assessment,
          explainableRecommendation: null,
          tenderReport: data,
          candidateMode: false,
          candidateQuery: data.assessment.originalRequirement,
          questionCatalog: questionCatalogRef.current,
          clarificationDraft: answerDraftRef.current
        });
      } else {
        setAnalysis(null);
        saveRecommendationState({
          query: "",
          results: [],
          mode: "text",
          selectedFileName: data.fileName || file.name,
          requirementAnalysis: null,
          explainableRecommendation: null,
          tenderReport: data,
          candidateMode: false,
          candidateQuery: "",
          questionCatalog: {},
          clarificationDraft: {}
        });
      }
    } catch (error) {
      setTenderReport(null);
      setReferenceAuditText("");
      setReferenceAudit(null);
      saveRecommendationState({
        query: "",
        results: [],
        mode: "text",
        selectedFileName: file.name,
        requirementAnalysis: null,
        explainableRecommendation: null,
        tenderReport: null,
        candidateMode: false,
        candidateQuery: "",
        questionCatalog: {},
        clarificationDraft: {}
      });
      setUploadError(t(tenderRequestErrorKey(error)));
    } finally {
      setTenderAnalyzing(false);
    }
  }

  async function runReferenceIntegrityAudit() {
    const tenderText = referenceAuditText.trim();
    if (!tenderText) {
      setReferenceAuditError(t("referenceAuditEmpty"));
      setReferenceAudit(null);
      return;
    }

    setReferenceAuditLoading(true);
    setReferenceAuditError("");
    setReferenceAudit(null);
    try {
      const data = await apiRequest("/reference-integrity/audit", {
        method: "POST",
        body: JSON.stringify({ tenderText })
      });
      if (!Number.isInteger(data?.totalReferencesChecked) || !Array.isArray(data?.findings)) {
        throw new Error("The reference integrity audit response was incomplete.");
      }
      setReferenceAudit(data);
    } catch {
      setReferenceAuditError(t("referenceAuditError"));
    } finally {
      setReferenceAuditLoading(false);
    }
  }

  return (
    <div className="page-shell dashboard-shell">
      <header className="dashboard-header">
        <div className="container nav-row">
          <Link to="/" className="dashboard-brand">
            <ProcureIQLogo />
          </Link>

          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <Link to="/standards">{t("navStandards")}</Link>
            <Link to="/about">{t("navAbout")}</Link>
            <Link to="/">{t("home")}</Link>
          </nav>
          <PreferenceControls />
        </div>
      </header>

      <main className="container dashboard-main">
        <motion.section
          className="dashboard-welcome"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <span className="section-kicker">
              <span className="kicker-dot">✦</span>
              {t("procurementIntelligence")}
            </span>
            <h1>{greeting}</h1>
            <p>
              {t("dashboardIntro")}
            </p>
          </div>
          <div className="live-pill">{t("liveMatching")}</div>
        </motion.section>

        <section className="search-panel">
          <div className="panel-heading">
            <h2>{t("findStandard")}</h2>
          </div>

          <div className="search-panel-row">
            <div className="panel-input">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchStandards();
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
              />
            </div>
            <button type="button" className="primary-btn" onClick={searchStandards} disabled={analysisLoading || matchingLoading}>
              {analysisLoading ? t("requirementAnalysisLoading") : matchingLoading ? t("requirementMatching") : t("searchButton")}
            </button>
          </div>

          <div className="inline-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={uploadTender}
              onCancel={() => setUploadError("Please select a PDF file to upload.")}
              hidden
            />
            <input
              ref={tenderFileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={analyzeTender}
              hidden
            />
            <button
              type="button"
              className="secondary-btn alt-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? t("analyzing") : t("uploadTender")}
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => tenderFileInputRef.current?.click()}
              disabled={tenderAnalyzing || analysisLoading}
            >
              {tenderAnalyzing ? t("tenderAnalyzing") : t("tenderAnalyzeAction")}
            </button>
            {selectedFileName && <span className="example-text">{selectedFileName}</span>}
            {uploadError && <span className="example-text" role="alert">{uploadError}</span>}
            <span className="example-text">{t("example")} “Road construction ke liye cement chahiye”</span>
          </div>
        </section>

        {tenderReport && (
          <section className="requirement-analysis-panel" aria-labelledby="tender-completeness-title">
            <div className="requirement-analysis-heading">
              <div>
                <span className="section-kicker small-kicker">{t("tenderReportKicker")}</span>
                <h2 id="tender-completeness-title">{t("tenderCompletenessTitle")}</h2>
              </div>
              <span className={`requirement-status requirement-status-${tenderReport.extractionStatus?.toLowerCase()}`}>
                {t({
                  SUCCESS: "tenderExtractionSuccess",
                  EMPTY: "tenderExtractionEmpty",
                  TOO_LONG: "tenderExtractionTooLong",
                  FAILED: "tenderExtractionFailed"
                }[tenderReport.extractionStatus] || "tenderExtractionFailed")}
              </span>
            </div>
            {tenderReport.assessment && (
              <>
                <div className="requirement-review-grid">
                  <div className="requirement-review-item">
                    <h3>{t("tenderDetectedProduct")}</h3>
                    <p>{tenderReport.assessment.productFamilyId || tenderReport.assessment.category || t("tenderProductNotDetected")}</p>
                  </div>
                  <div className="requirement-review-item">
                    <h3>{t("requirementStatus")}</h3>
                    <p>{statusLabel(tenderReport.assessment.status)}</p>
                  </div>
                </div>
                <div className="requirement-detail-block">
                  <h3>{t("tenderSpecificationsFound")}</h3>
                  {tenderReport.assessment.identifiedSpecifications?.length > 0 ? (
                    <ul>
                      {tenderReport.assessment.identifiedSpecifications.map((specification) => (
                        <li key={specification.attributeId}>
                          <strong>{localizedAnalysisKey(specification.labelKey, specification.attributeId)}: </strong>
                          {specification.value}
                        </li>
                      ))}
                    </ul>
                  ) : <p>{t("tenderNoSpecificationsFound")}</p>}
                </div>
                <div className="requirement-detail-block">
                  <h3>{t("tenderMissingSpecifications")}</h3>
                  {tenderReport.assessment.materialMissingAttributes?.length > 0 ? (
                    <ul>
                      {tenderReport.assessment.materialMissingAttributes.map((attribute) => (
                        <li key={attribute.attributeId}>
                          {localizedAnalysisKey(attribute.labelKey, attribute.attributeId)}
                          {" — "}
                          {informationStatusLabel(attribute.informationStatus)}
                        </li>
                      ))}
                    </ul>
                  ) : <p>{t("tenderNoMaterialGaps")}</p>}
                </div>
                {tenderReport.assessment.reasons?.length > 0 && (
                  <div className="requirement-detail-block">
                    <h3>{t("tenderWhyUncertain")}</h3>
                    <ul>
                      {tenderReport.assessment.reasons.map((reason, index) => (
                        <li key={`${reason.code}-${index}`}>{localizedReason(reason)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {tenderReport.assessment.status === "CLEAR" && !explainableRecommendation && (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={reassessRequirement}
                    disabled={analysisLoading}
                  >
                    {analysisLoading ? t("requirementMatching") : t("tenderGetRecommendations")}
                  </button>
                )}
                {tenderReport.assessment.status === "AMBIGUOUS" && !questionnaireOpen && (
                  <button type="button" className="primary-btn" onClick={beginClarification}>
                    {t("tenderClarify")}
                  </button>
                )}
              </>
            )}
            {tenderReport.extractionStatus !== "SUCCESS" && (
              <p className="requirement-disclosure">
                {t({
                  EMPTY: "tenderEmptyLimitation",
                  TOO_LONG: "tenderTooLongLimitation",
                  FAILED: "tenderFailedLimitation"
                }[tenderReport.extractionStatus] || "tenderAnalysisFailed")}
              </p>
            )}
            {tenderReport.extractionStatus === "SUCCESS" && tenderReport.extractedText && (
              <details className="requirement-detail-block">
                <summary>{t("tenderExtractedText")}</summary>
                <p>{t("tenderTextDisclosure")}</p>
                <p className="tender-extracted-text">
                  {formatTenderTextForDisplay(tenderReport.extractedText)}
                </p>
              </details>
            )}
          </section>
        )}

        <section className="requirement-analysis-panel" aria-labelledby="reference-audit-title">
          <div className="requirement-analysis-heading">
            <div>
              <span className="section-kicker small-kicker">{t("referenceAuditTitle")}</span>
              <h2 id="reference-audit-title">{t("referenceAuditTitle")}</h2>
              <p className="requirement-analysis-copy">{t("referenceAuditDescription")}</p>
            </div>
          </div>
          <label className="reference-audit-label" htmlFor="reference-audit-text">
            {t("referenceAuditTextLabel")}
          </label>
          <textarea
            id="reference-audit-text"
            className="requirement-other-input reference-audit-text"
            value={referenceAuditText}
            onChange={(event) => {
              setReferenceAuditText(event.target.value);
              setReferenceAudit(null);
              setReferenceAuditError("");
            }}
            disabled={referenceAuditLoading}
            placeholder={t("referenceAuditTextPlaceholder")}
            maxLength={100000}
            rows={5}
          />
          <div>
            <button
              type="button"
              className="primary-btn"
              onClick={runReferenceIntegrityAudit}
              disabled={referenceAuditLoading || !referenceAuditText.trim()}
            >
              {referenceAuditLoading ? t("referenceAuditRunning") : t("referenceAuditRun")}
            </button>
          </div>
          {referenceAuditError && <p className="requirement-inline-error" role="alert">{referenceAuditError}</p>}
          {referenceAudit && (
            <div className="reference-audit-results" aria-live="polite">
              <div className="reference-audit-summary">
                <div><strong>{t("referenceAuditTotal")}</strong><span>{referenceAudit.totalReferencesChecked}</span></div>
                <div><strong>{t("referenceAuditMatched")}</strong><span>{referenceAudit.matchedReferenceCount}</span></div>
                <div><strong>{t("referenceAuditNeedsReview")}</strong><span>{referenceAudit.itemsNeedingReviewCount}</span></div>
                <div><strong>{t("referenceAuditUnknownCount")}</strong><span>{referenceAudit.unknownReferenceCount}</span></div>
                <div><strong>{t("referenceAuditInconclusiveCount")}</strong><span>{referenceAudit.inconclusiveCheckCount}</span></div>
              </div>
              {referenceAudit.totalReferencesChecked === 0 ? (
                <p>{t("referenceAuditEmpty")}</p>
              ) : (
                <>
                  {referenceAudit.findings.length === 0 && (
                    <p className="reference-audit-empty">{t("referenceAuditNoFindings")}</p>
                  )}
                  {referenceAudit.matchedReferences.some((match) => !match.issueIdentified) && (
                    <div className="reference-audit-clean-matches">
                      <h3>{t("referenceAuditCleanMatches")}</h3>
                      <ul>
                        {referenceAudit.matchedReferences.filter((match) => !match.issueIdentified).map((match) => (
                          <li key={match.tenderReference}>
                            <strong>{match.tenderReference}</strong>
                            {" — "}
                            {match.databaseEvidence?.isNumber} — {match.databaseEvidence?.title}
                          </li>
                        ))}
                      </ul>
                      <p>{t("referenceAuditCleanExplanation")}</p>
                    </div>
                  )}
                  {referenceAudit.findings.length > 0 && (
                    <>
                      <h3>{t("referenceAuditFindings")}</h3>
                      {Object.entries(referenceAudit.findings.reduce((groups, finding) => {
                        const type = finding.issueType || "INSUFFICIENT_DATA";
                        groups[type] = [...(groups[type] || []), finding];
                        return groups;
                      }, {})).map(([issueType, findings]) => (
                        <div className="reference-audit-group" key={issueType}>
                          <h4>{t({
                            RECORDED_SUPERSESSION: "referenceAuditSupersession",
                            EDITION_YEAR_NEEDS_REVIEW: "referenceAuditEditionMismatch",
                            NOT_FOUND_IN_CURATED_DATASET: "referenceAuditUnknown",
                            INSUFFICIENT_DATA: "referenceAuditInconclusive"
                          }[issueType] || "referenceAuditInconclusive")}</h4>
                          {findings.map((finding, index) => (
                            <article
                              className={`requirement-review-item reference-audit-finding reference-audit-${finding.severity?.toLowerCase() || "inconclusive"}`}
                              key={`${finding.tenderReference}-${index}`}
                            >
                              <h5>{finding.tenderReference}</h5>
                              <p><strong>{t("referenceAuditSeverity")}: </strong>{t({
                                REVIEW: "referenceAuditLevelReview",
                                INFORMATIONAL: "referenceAuditLevelInformational",
                                INCONCLUSIVE: "referenceAuditLevelInconclusive"
                              }[finding.severity] || "referenceAuditLevelInconclusive")}</p>
                              {finding.databaseEvidence && (
                                <div>
                                  <strong>{t("referenceAuditDatabaseRecord")}: </strong>
                                  <span>{finding.databaseEvidence.isNumber} — {finding.databaseEvidence.title}</span>
                                  {finding.databaseEvidence.editionYear != null && (
                                    <p><strong>{t("referenceAuditEdition")}: </strong>{finding.databaseEvidence.editionYear}</p>
                                  )}
                                  {finding.databaseEvidence.status && (
                                    <p><strong>{t("referenceAuditStatus")}: </strong>{finding.databaseEvidence.status}</p>
                                  )}
                                  {finding.databaseEvidence.supersedingIs
                                    && finding.databaseEvidence.supersedingIs !== "NONE_IDENTIFIED" && (
                                    <p><strong>{t("referenceAuditSuperseding")}: </strong>{finding.databaseEvidence.supersedingIs}</p>
                                  )}
                                  {finding.databaseEvidence.sourceUrl && (
                                    <p><strong>{t("requirementSource")}: </strong>{finding.databaseEvidence.sourceUrl}</p>
                                  )}
                                </div>
                              )}
                              {finding.supportingEvidence?.length > 0 && (
                                <div>
                                  <strong>{t("referenceAuditEvidence")}</strong>
                                  <ul>{finding.supportingEvidence.map((evidence, evidenceIndex) => (
                                    <li key={`${evidenceIndex}-${evidence}`}>{evidence}</li>
                                  ))}</ul>
                                </div>
                              )}
                              {finding.explanation && (
                                <p><strong>{t("referenceAuditExplanation")}: </strong>{finding.explanation}</p>
                              )}
                              {finding.suggestedAction && (
                                <p><strong>{t("referenceAuditAction")}: </strong>{finding.suggestedAction}</p>
                              )}
                            </article>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
              <p className="requirement-disclosure">{t("referenceAuditDisclaimer")}</p>
            </div>
          )}
        </section>

        {analysisError && (
          <div className="requirement-error" role="alert">{analysisError}</div>
        )}

        {analysis && (
          <section className="requirement-analysis-panel" aria-labelledby="requirement-analysis-title">
            <div className="requirement-analysis-heading">
              <div>
                <span className="section-kicker small-kicker">{t("requirementAnalysis")}</span>
                <h2 id="requirement-analysis-title">{t("requirementStatus")}</h2>
              </div>
              <span className={`requirement-status requirement-status-${analysis.status?.toLowerCase()}`}>
                {statusLabel(analysis.status)}
              </span>
            </div>

            {analysisWarningVisible && (
              <div className="requirement-warning-banner requirement-warning-inline" role="status">
                <strong>
                  {analysis.status === "AMBIGUOUS"
                    ? t("requirementAmbiguousBannerTitle")
                    : t("requirementUnresolvedBannerTitle")}
                </strong>
                <p>
                  {analysis.status === "AMBIGUOUS"
                    ? t("requirementAmbiguousBannerBody")
                    : explainableRecommendation?.statusExplanation || statusExplanation(analysis.status)}
                </p>
              </div>
            )}

            <div className="requirement-analysis-copy">
              <p>{explainableRecommendation?.statusExplanation || statusExplanation(analysis.status)}</p>
            </div>

            {analysis.reasons?.length > 0 && (
              <ul className="requirement-reasons">
                {analysis.reasons.map((reason, index) => (
                  <li key={`${reason.code}-${index}`}>{localizedReason(reason)}</li>
                ))}
              </ul>
            )}

            <div className={`requirement-review-grid${showInterpretedRequirement ? "" : " requirement-review-grid-single"}`}>
              <div className="requirement-review-item">
                <h3>{t("requirementOriginal")}</h3>
                <p>{formatRequirementForReview(originalRequirement)}</p>
              </div>
              {showInterpretedRequirement && (
                <div className="requirement-review-item">
                  <h3>{t("requirementInterpreted")}</h3>
                  <p>{formatRequirementForReview(interpretedRequirement)}</p>
                </div>
              )}
            </div>

            {analysis.materialMissingAttributes?.length > 0 && (
              <div className="requirement-detail-block">
                <h3>{t("requirementMissingInformation")}</h3>
                <ul>
                  {analysis.materialMissingAttributes.map((attribute) => (
                    <li key={attribute.attributeId}>
                      <span>{localizedAnalysisKey(attribute.labelKey, attribute.attributeId)}</span>
                      <span className="requirement-information-status">{informationStatusLabel(attribute.informationStatus)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.providedAnswers?.length > 0 && (
              <div className="requirement-detail-block">
                <div className="requirement-block-heading">
                  <h3>{t("requirementReviewAnswers")}</h3>
                  {Object.keys(questionCatalog).length > 0 && (
                    <button type="button" className="text-button" onClick={beginClarification}>
                      {t("requirementEditAnswers")}
                    </button>
                  )}
                </div>
                <ul>
                  {analysis.providedAnswers.map((answer) => {
                    const question = questionCatalog[answer.questionId];
                    const option = question?.options?.find((item) => item.id === answer.optionId);
                    return (
                      <li key={answer.questionId}>
                        <span>{localizedAnalysisKey(question?.promptKey, answer.questionId)}</span>
                        <span>
                          {option ? localizedAnalysisKey(option.labelKey, answer.optionId) : answer.optionId}
                          {answer.otherText ? ` — ${answer.otherText}` : ""}
                          <small className="requirement-information-status">{informationStatusLabel(answer.informationStatus)}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {questionnaireOpen && (
              <div className="requirement-questionnaire">
                <div className="requirement-block-heading">
                  <h3>{t("requirementClarification")}</h3>
                  <button type="button" className="text-button" onClick={() => setQuestionnaireOpen(false)}>
                    {t("requirementCancelEdit")}
                  </button>
                </div>
                <p>{t("requirementAnswerPrompt")}</p>
                {getQuestionnaireQuestions().map((question) => {
                  const currentAnswer = answersDraft[question.id] ?? { optionId: "", otherText: "" };
                  const selectedOption = question.options.find((option) => option.id === currentAnswer.optionId);
                  const referenceQuestion = question.id === "reference.is_number";
                  return (
                    <fieldset className="requirement-question-card" key={question.id}>
                      <legend>
                        {localizedAnalysisKey(question.promptKey, question.id)}
                        {!question.material && <small className="requirement-optional-label"> ({t("requirementOptionalQuestion")})</small>}
                      </legend>
                      {question.options.map((option) => (
                        <label className="requirement-radio-option" key={option.id}>
                          <input
                            type="radio"
                            name={`requirement-answer-${question.id}`}
                            value={option.id}
                            checked={currentAnswer.optionId === option.id}
                            onChange={() => updateAnswer(question.id, option.id)}
                          />
                          <span>{localizedAnalysisKey(option.labelKey, option.id)}</span>
                        </label>
                      ))}
                      {currentAnswer.optionId
                        && selectedOption?.otherTextAllowed
                        && (
                          <input
                            className="requirement-other-input"
                            type="text"
                            maxLength={500}
                            value={currentAnswer.otherText}
                            onChange={(event) => updateAnswer(question.id, currentAnswer.optionId, event.target.value)}
                            placeholder={referenceQuestion ? t("requirementIsNumberPlaceholder") : t("requirementOtherPlaceholder")}
                            aria-label={referenceQuestion ? t("requirementIsNumberPlaceholder") : t("requirementOtherPlaceholder")}
                          />
                        )}
                    </fieldset>
                  );
                })}
                {analysisError && <p className="requirement-inline-error" role="alert">{analysisError}</p>}
                <button
                  type="button"
                  className="primary-btn"
                  onClick={reassessRequirement}
                  disabled={analysisLoading}
                >
                  {analysisLoading ? t("requirementAnalysisLoading") : t("requirementSubmitAnswers")}
                </button>
              </div>
            )}

            {analysis.interpretationDisclosureKey && (
              <p className="requirement-disclosure">
                {localizedAnalysisKey(analysis.interpretationDisclosureKey, t("requirementDisclosure"))}
              </p>
            )}

            {analysis.userProvidedStandardReference && (
              <p className="requirement-reference-disclosure">
                <strong>{t("requirementReferenceUnverified")}: </strong>
                {analysis.userProvidedStandardReference}
                {" — "}
                {standardReferenceVerificationText(analysis.standardReferenceVerificationStatus)}
                {" "}
                {t("requirementIsReferenceDisclosure")}
              </p>
            )}

            {analysis.status === "CLEAR" && <p className="requirement-clear-disclosure">{t("requirementWarningsClearOnly")}</p>}

            {analysis.status === "AMBIGUOUS" && !questionnaireOpen && !explainableRecommendation && (
              <div className="requirement-choice-grid">
                <article className="requirement-choice-card">
                  <h3>{t("requirementDirectTitle")}</h3>
                  <p>{t("requirementDirectDescription")}</p>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={startDirectMatching}
                    disabled={matchingLoading}
                  >
                    {matchingLoading ? t("requirementMatching") : t("requirementContinueMatching")}
                  </button>
                </article>
                <article className="requirement-choice-card requirement-choice-emphasis">
                  <h3>{t("requirementRefineTitle")}</h3>
                  <p>{t("requirementRefineDescription")}</p>
                  <button type="button" className="primary-btn" onClick={beginClarification}>
                    {t("requirementClarification")}
                  </button>
                </article>
              </div>
            )}

            {analysis.providedAnswers?.length > 0 && !questionnaireOpen && (
              <div className="requirement-refined-actions">
                {wordingConfirmed
                  ? <p className="requirement-confirmation-note">{t("requirementWordingConfirmed")}</p>
                  : <button type="button" className="secondary-btn" onClick={() => setWordingConfirmed(true)}>{t("requirementConfirmWording")}</button>}
                {(analysis.status === "CLEAR" || analysis.status === "AMBIGUOUS")
                  && !explainableRecommendation && (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={startRefinedMatching}
                    disabled={matchingLoading}
                  >
                    {matchingLoading ? t("requirementMatching") : t("requirementContinueMatching")}
                  </button>
                )}
                {!wordingConfirmed && <small>{t("requirementNotConfirmed")}</small>}
              </div>
            )}
          </section>
        )}

        <div className="dashboard-layout">
          <section className="results-panel">
            <div className="panel-header">
              <div>
                <span className="section-kicker small-kicker">
                  <span className="kicker-dot">✦</span>
                  {recommendationWarningVisible ? t("requirementCandidateMatches") : t("aiRecommendations")}
                </span>
                <h2>{recommendationWarningVisible ? t("requirementCandidateMatches") : t("recommendedStandards")}</h2>
              </div>
              {activeRecommendationItems.length > 0 && (
                <span className="result-count">
                  {activeRecommendationItems.length}{" "}
                  {recommendationWarningVisible ? t("requirementCandidateMatches") : t("matches")}
                </span>
              )}
            </div>

            {recommendationWarningVisible && (
              <div className="requirement-warning-banner" role="status" aria-live="polite">
                <strong>
                  {analysis?.status === "AMBIGUOUS"
                    ? t("requirementAmbiguousBannerTitle")
                    : t("requirementUnresolvedBannerTitle")}
                </strong>
                <p>
                  {explainableRecommendation?.statusExplanation
                    || (analysis?.status === "AMBIGUOUS"
                      ? t("requirementAmbiguousBannerBody")
                      : statusExplanation(analysis?.status))}
                </p>
                {candidateWarningVisible && (
                  <button type="button" className="text-button" onClick={beginClarification}>
                    {t("requirementRefineLater")}
                  </button>
                )}
              </div>
            )}

            {searchError ? (
              <div className="empty-results" role="alert">
                <h3>{searchError}</h3>
              </div>
            ) : analysisError && !analysis ? (
              <div className="empty-results" role="alert">
                <h3>{t("requirementAnalysis")}</h3>
                <p>{analysisError}</p>
              </div>
            ) : explainableRecommendation && explainableCandidates.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">{isUnresolvedAnalysis(analysis) ? "⚠" : "✦"}</div>
                <h3>{statusLabel(analysis?.status)}</h3>
                <p>{explainableRecommendation.statusExplanation || t("requirementNoExplainableCandidates")}</p>
                {!isUnresolvedAnalysis(analysis) && <p>{t("requirementNoExplainableCandidates")}</p>}
              </div>
            ) : !explainableRecommendation && candidateWarningVisible && results.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">⚠</div>
                <h3>{t("requirementCandidateTitle")}</h3>
                <p>{t("requirementCandidateResultsEmpty")}</p>
              </div>
            ) : !explainableRecommendation && candidateWarningVisible && candidateResults.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">⚠</div>
                <h3>{t("requirementCandidateTitle")}</h3>
                <p>{t("requirementCandidateNoEvidence")}</p>
                <p>{t("requirementCandidateCountNone")}</p>
              </div>
            ) : !explainableRecommendation && results.length === 0 && analysis && !matchingAttempted ? (
              <div className="empty-results">
                <div className="empty-icon">✦</div>
                <h3>{statusLabel(analysis.status)}</h3>
                <p>{statusExplanation(analysis.status)}</p>
              </div>
            ) : !explainableRecommendation && results.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">✦</div>
                <h3>{t("noMatches")}</h3>
                <p>{t("tryAnother")}</p>
              </div>
            ) : explainableRecommendation ? (
              <div className="results-list candidate-results-list">
                {explainableCandidates.map((candidate, index) => {
                  const standard = candidate?.standard && typeof candidate.standard === "object"
                    ? candidate.standard
                    : {};
                  const standardKey = standard.isNumber;
                  const score = typeof standard.score === "number" && Number.isFinite(standard.score)
                    ? standard.score
                    : null;
                  const metadataEvidence = Array.isArray(candidate?.metadataEvidence)
                    ? candidate.metadataEvidence
                    : [];
                  const knownAnswers = Array.isArray(candidate?.knownAnswerEvidence)
                    ? candidate.knownAnswerEvidence
                    : [];
                  const unresolvedDetails = Array.isArray(candidate?.unresolvedMaterialDetails)
                    ? candidate.unresolvedMaterialDetails
                    : [];
                  return (
                    <article className="result-card candidate-result-card" key={standardKey || `candidate-${candidate?.rank ?? index}`}>
                      {standardKey && (
                        <Link
                          to={`/standards/${encodeURIComponent(standardKey)}`}
                          state={{ fromRecommendations: true }}
                          className="candidate-standard-link"
                        >
                          <div className="result-rank">{candidate?.rank ?? index + 1}</div>
                          <div className="result-info">
                            <span className="standard-number">{standardKey}</span>
                            <h3>{standard.title || t("requirementNotAvailable")}</h3>
                            <span className="candidate-unverified-label">{t("requirementCandidateTitle")}</span>
                            <div className="result-meta">
                              {standard.category && <span>{standard.category}</span>}
                              {standard.editionYear != null && <span>{t("edition")} {standard.editionYear}</span>}
                              {standard.status && <span className="status-badge">{standard.status}</span>}
                            </div>
                          </div>
                        </Link>
                      )}
                      {!standardKey && (
                        <div className="candidate-standard-link">
                          <div className="result-rank">{candidate?.rank ?? index + 1}</div>
                          <div className="result-info">
                            <h3>{standard.title || t("requirementNotAvailable")}</h3>
                            <span className="candidate-unverified-label">{t("requirementCandidateTitle")}</span>
                          </div>
                        </div>
                      )}
                      <div className="candidate-explanation">
                        {candidate?.retrievalExplanation && (
                          <div>
                            <h4>{t("requirementRetrievalExplanation")}</h4>
                            <p>{candidate.retrievalExplanation}</p>
                          </div>
                        )}
                        {(score != null || candidate?.scoreMeaning) && (
                          <div>
                            <h4>{t("requirementSimilarityScore")}</h4>
                            {score != null && <p>{score.toFixed(4)}</p>}
                            {candidate?.scoreMeaning === "SEMANTIC_SIMILARITY_NOT_PROBABILITY"
                              ? <p>{t("requirementScoreMeaning")}</p>
                              : candidate?.scoreMeaning && <p>{candidate.scoreMeaning}</p>}
                          </div>
                        )}
                        <p><strong>{t("requirementApplicability")}: </strong>
                          {candidate?.applicabilityVerified === true
                            ? t("requirementApplicabilityVerified")
                            : candidate?.applicabilityVerified === false
                              ? t("requirementApplicabilityNotVerified")
                              : t("requirementNotAvailable")}
                        </p>
                        <div>
                          <h4>{t("requirementCandidateEvidence")}</h4>
                          {metadataEvidence.length > 0 ? (
                            <ul>
                              {metadataEvidence.map((evidence, evidenceIndex) => (
                                <li key={`${evidence?.sourceField ?? "metadata"}-${evidenceIndex}`}>
                                  {evidence?.sourceField && <strong>{evidence.sourceField}: </strong>}
                                  {Array.isArray(evidence?.sharedTerms) && evidence.sharedTerms.length > 0
                                    ? evidence.sharedTerms.join(", ")
                                    : t("requirementNoMetadataEvidence")}
                                </li>
                              ))}
                            </ul>
                          ) : <p>{t("requirementNoMetadataEvidence")}</p>}
                        </div>
                        <div>
                          <h4>{t("requirementKnownAnswerEvidence")}</h4>
                          {knownAnswers.length > 0 ? (
                            <ul>
                              {knownAnswers.map((answer, answerIndex) => {
                                const question = questionCatalog[answer?.questionId];
                                const evidence = Array.isArray(answer?.metadataEvidence) ? answer.metadataEvidence : [];
                                return (
                                  <li key={`${answer?.questionId ?? "answer"}-${answerIndex}`}>
                                    <strong>{localizedAnalysisKey(question?.promptKey, answer?.questionId || t("requirementNotAvailable"))}: </strong>
                                    {answer?.interpretedValue || t("requirementNotAvailable")}
                                    {evidence.length > 0 ? (
                                      <ul>
                                        {evidence.map((item, evidenceIndex) => (
                                          <li key={`${item?.sourceField ?? "metadata"}-${evidenceIndex}`}>
                                            {item?.sourceField && <strong>{item.sourceField}: </strong>}
                                            {Array.isArray(item?.sharedTerms) && item.sharedTerms.length > 0
                                              ? item.sharedTerms.join(", ")
                                              : t("requirementNoMetadataEvidence")}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : <span> — {t("requirementNoAnswerEvidence")}</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : <p>{t("requirementNoKnownAnswers")}</p>}
                        </div>
                        <div>
                          <h4>{t("requirementCandidateUncertainty")}</h4>
                          {unresolvedDetails.length > 0 ? (
                            <ul>
                              {unresolvedDetails.map((detail, detailIndex) => (
                                <li key={`${detail?.attributeId ?? "detail"}-${detailIndex}`}>
                                  {localizedAnalysisKey(detail?.labelKey, detail?.attributeId || t("requirementNotAvailable"))}
                                  {detail?.informationStatus && ` — ${informationStatusLabel(detail.informationStatus)}`}
                                </li>
                              ))}
                            </ul>
                          ) : <p>{t("requirementNoUnresolvedDetails")}</p>}
                        </div>
                        <dl className="candidate-metadata">
                          {standard.scopeSummary && <><dt>{t("requirementScope")}</dt><dd>{standard.scopeSummary}</dd></>}
                          {standard.editionYear != null && <><dt>{t("edition")}</dt><dd>{standard.editionYear}</dd></>}
                          {standard.status && <><dt>{t("status")}</dt><dd>{standard.status}</dd></>}
                          {standard.supersedingIs && <><dt>{t("superseding")}</dt><dd>{standard.supersedingIs}</dd></>}
                          {standard.amendmentCount && <><dt>{t("amendmentCount")}</dt><dd>{standard.amendmentCount}</dd></>}
                          {standard.latestAmendmentNote && <><dt>{t("latestAmendment")}</dt><dd>{standard.latestAmendmentNote}</dd></>}
                          {standard.certificationStatus && <><dt>{t("certificationStatus")}</dt><dd>{standard.certificationStatus}</dd></>}
                          {standard.certificationType && <><dt>{t("certificationType")}</dt><dd>{standard.certificationType}</dd></>}
                          {standard.qcoReference && <><dt>{t("qcoReference")}</dt><dd>{standard.qcoReference}</dd></>}
                          {standard.verificationStatus && <><dt>{t("verification")}</dt><dd>{standard.verificationStatus}</dd></>}
                          {standard.sourceUrl && <><dt>{t("requirementSource")}</dt><dd>{standard.sourceUrl}</dd></>}
                        </dl>
                        {standard.certificationRequirements?.length > 0 && (
                          <div className="candidate-certification-requirements">
                            <h4>{t("certificationCompliance")}</h4>
                            <ul>
                              {standard.certificationRequirements.map((requirement, requirementIndex) => (
                                <li key={requirement.certificationId ?? `${requirement.certificationType}-${requirementIndex}`}>
                                  {requirement.certificationType && <strong>{requirement.certificationType}: </strong>}
                                  {requirement.requirementDescription}
                                  {requirement.requirementStatus && ` (${requirement.requirementStatus})`}
                                  {requirement.qcoReference && ` — ${requirement.qcoReference}`}
                                  {requirement.sourceUrl && ` — ${requirement.sourceUrl}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={candidateWarningVisible ? "results-list candidate-results-list" : "results-list"}>
                {candidateWarningVisible && candidateResults.length === 1 && (
                  <p className="requirement-candidate-count-note">{t("requirementCandidateCountOne")}</p>
                )}
                {(candidateWarningVisible ? candidateResults.map((candidate) => candidate.item) : results).map((item, index) => {
                  const score = Math.round((item.score || 0) * 100);
                  const key = item.isNumber || `${item.title}-${index}`;
                  const candidate = candidateWarningVisible ? candidateResults[index] : null;

                  return (
                    <article className={candidateWarningVisible ? "result-card candidate-result-card" : "result-card"} key={key}>
                      <Link
                        to={`/standards/${encodeURIComponent(key)}`}
                        state={{ fromRecommendations: true }}
                        className="candidate-standard-link"
                      >
                        <div className="result-rank">0{index + 1}</div>
                        <div className="result-info">
                          <span className="standard-number">{key}</span>
                          <h3>{item.title}</h3>
                          {candidateWarningVisible && <span className="candidate-unverified-label">{t("requirementCandidateTitle")}</span>}
                          <div className="result-meta">
                            {item.category && <span>{item.category}</span>}
                            {item.editionYear != null && <span>{t("edition")} {item.editionYear}</span>}
                            {item.status && <span className="status-badge">{item.status}</span>}
                          </div>
                        </div>
                        {!candidateWarningVisible && (
                          <div className="score-box">
                            <strong>{score}%</strong>
                            <span>{t("semanticMatch")}</span>
                            <div className="score-bar">
                              <span style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        )}
                      </Link>
                      {candidateWarningVisible && (
                        <div className="candidate-explanation">
                          {typeof item.score === "number" && Number.isFinite(item.score) && (
                            <p><strong>{t("requirementSimilarityScore")}: </strong>{item.score.toFixed(4)}</p>
                          )}
                          <div>
                            <h4>{t("requirementCandidateEvidence")}</h4>
                            {candidate?.evidenceTerms?.length > 0
                              ? <p>{t("requirementCandidateEvidencePrefix")} <strong>{candidate.evidenceTerms.join(", ")}</strong></p>
                              : <p>{t("requirementCandidateNoEvidence")}</p>}
                            {item.scopeSummary && <p className="candidate-scope-evidence">{item.scopeSummary}</p>}
                          </div>
                          <div>
                            <h4>{t("requirementCandidateUncertainty")}</h4>
                            {analysis.materialMissingAttributes?.length > 0 ? (
                              <ul>
                                {analysis.materialMissingAttributes.map((attribute) => (
                                  <li key={attribute.attributeId}>
                                    {localizedAnalysisKey(attribute.labelKey, attribute.attributeId)}
                                    {" — "}
                                    {informationStatusLabel(attribute.informationStatus)}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>{statusExplanation(analysis.status)}</p>
                            )}
                          </div>
                          <dl className="candidate-metadata">
                            {item.editionYear != null && <><dt>{t("edition")}</dt><dd>{item.editionYear}</dd></>}
                            {item.status && <><dt>{t("status")}</dt><dd>{item.status}</dd></>}
                            {item.certificationStatus && <><dt>{t("certificationStatus")}</dt><dd>{item.certificationStatus}</dd></>}
                            {item.certificationType && <><dt>{t("certificationType")}</dt><dd>{item.certificationType}</dd></>}
                            {item.qcoReference && <><dt>{t("qcoReference")}</dt><dd>{item.qcoReference}</dd></>}
                            {item.verificationStatus && <><dt>{t("verification")}</dt><dd>{item.verificationStatus}</dd></>}
                          </dl>
                          {item.certificationRequirements?.length > 0 && (
                            <div className="candidate-certification-requirements">
                              <h4>{t("certificationCompliance")}</h4>
                              <ul>
                                {item.certificationRequirements.map((requirement, requirementIndex) => (
                                  <li key={requirement.certificationId ?? `${requirement.certificationType}-${requirementIndex}`}>
                                    {requirement.certificationType && <strong>{requirement.certificationType}: </strong>}
                                    {requirement.requirementDescription}
                                    {requirement.requirementStatus && ` (${requirement.requirementStatus})`}
                                    {requirement.qcoReference && ` — ${requirement.qcoReference}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="dashboard-side-panel">
            <div className="quick-actions-card">
              <div className="panel-header compact-header">
                <div>
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    {t("quickActions")}
                  </span>
                  <h3>{t("workflow")}</h3>
                </div>
              </div>

              <div className="quick-actions-grid">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.to} className="quick-action-card">
                    <span className="quick-action-icon">{action.icon}</span>
                    <span>{t(action.label)}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="recent-searches-card">
              <div className="panel-header compact-header">
                <div>
                  <span className="section-kicker small-kicker">
                    <span className="kicker-dot">✦</span>
                    {t("recentSearches")}
                  </span>
                  <h3>{t("recent")}</h3>
                </div>
              </div>

              <ul className="recent-list">
                {recentSearches.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => setQuery(item)}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
