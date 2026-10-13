package com.procureiq.service;

import com.procureiq.dto.ExplainableRecommendationResponse;
import com.procureiq.dto.ExplainableRecommendationResponse.Candidate;
import com.procureiq.dto.ExplainableRecommendationResponse.ClarificationEvidence;
import com.procureiq.dto.ExplainableRecommendationResponse.MetadataEvidence;
import com.procureiq.dto.RecommendationResponse;
import com.procureiq.dto.RecommendationResult;
import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.dto.RequirementAnalysisResponse;
import com.procureiq.dto.RequirementAnalysisResponse.AnalysisStatus;
import com.procureiq.dto.RequirementAnalysisResponse.InformationStatus;
import com.procureiq.dto.RequirementAnalysisResponse.ProvidedAnswer;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;

@Service
public class ExplainableRecommendationService {

    private static final Pattern TERMS = Pattern.compile("[\\p{L}\\p{N}]+");
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "from", "that", "this", "user", "provided",
            "clarification", "requirement", "standard", "standards", "indian"
    );

    private final RequirementAnalysisService requirementAnalysisService;
    private final RecommendationService recommendationService;

    public ExplainableRecommendationService(RequirementAnalysisService requirementAnalysisService,
                                            RecommendationService recommendationService) {
        this.requirementAnalysisService = requirementAnalysisService;
        this.recommendationService = recommendationService;
    }

    public ExplainableRecommendationResponse recommend(RequirementAnalysisRequest request) {
        RequirementAnalysisResponse assessment = requirementAnalysisService.analyze(request);
        ExplainableRecommendationResponse response = new ExplainableRecommendationResponse();
        response.setAssessment(assessment);
        response.setStatusExplanation(statusExplanation(assessment.getStatus()));

        if (assessment.getStatus() != AnalysisStatus.CLEAR
                && assessment.getStatus() != AnalysisStatus.AMBIGUOUS) {
            response.setMatchingQuery(null);
            response.setCandidates(List.of());
            return response;
        }

        String matchingQuery = assessment.getInterpretedRequirement();
        response.setMatchingQuery(matchingQuery);
        RecommendationResponse recommendations = recommendationService.recommend(matchingQuery);
        List<RecommendationResult> results = recommendations.getResults() == null
                ? List.of()
                : recommendations.getResults();
        List<Candidate> candidates = new ArrayList<>();
        for (int index = 0; index < results.size(); index++) {
            candidates.add(toCandidate(index + 1, results.get(index), assessment, matchingQuery));
        }
        response.setCandidates(candidates);
        return response;
    }

    private Candidate toCandidate(int rank, RecommendationResult result,
                                  RequirementAnalysisResponse assessment, String matchingQuery) {
        Candidate candidate = new Candidate();
        candidate.setRank(rank);
        candidate.setStandard(result);
        candidate.setRetrievalExplanation(
                "Returned by the semantic matching service for the interpreted requirement at rank " + rank + ".");
        candidate.setUnresolvedMaterialDetails(assessment.getMaterialMissingAttributes());
        candidate.setMetadataEvidence(metadataEvidence(matchingQuery, result));
        candidate.setKnownAnswerEvidence(assessment.getProvidedAnswers().stream()
                .filter(answer -> answer.getInformationStatus() == InformationStatus.KNOWN)
                .map(answer -> new ClarificationEvidence(answer,
                        metadataEvidence(answer.getInterpretedValue(), result)))
                .toList());
        return candidate;
    }

    private List<MetadataEvidence> metadataEvidence(String text, RecommendationResult result) {
        List<MetadataEvidence> evidence = new ArrayList<>();
        addEvidence(evidence, "title", text, result.getTitle());
        addEvidence(evidence, "scopeSummary", text, result.getScopeSummary());
        return evidence;
    }

    private void addEvidence(List<MetadataEvidence> evidence, String sourceField,
                             String queryText, String metadataText) {
        List<String> sharedTerms = sharedTerms(queryText, metadataText);
        if (!sharedTerms.isEmpty()) {
            evidence.add(new MetadataEvidence(sourceField, sharedTerms));
        }
    }

    private List<String> sharedTerms(String queryText, String metadataText) {
        if (queryText == null || metadataText == null) return List.of();
        Set<String> queryTerms = terms(queryText);
        queryTerms.retainAll(terms(metadataText));
        return List.copyOf(queryTerms);
    }

    private Set<String> terms(String text) {
        Set<String> terms = new TreeSet<>();
        var matcher = TERMS.matcher(text.toLowerCase(Locale.ROOT));
        while (matcher.find()) {
            String term = matcher.group();
            if (term.length() > 2 && !STOP_WORDS.contains(term)) {
                terms.add(term);
            }
        }
        return terms;
    }

    private String statusExplanation(AnalysisStatus status) {
        return switch (status) {
            case CLEAR -> "No unresolved ambiguity was detected by the current rule set. This does not establish standard applicability, certification, or compliance.";
            case AMBIGUOUS -> "Candidates are provisional because material requirement details remain unresolved. Similarity does not establish which standard applies.";
            case UNCERTAIN -> "Reliable classification was not possible, so candidate matching was not run.";
            case UNSUPPORTED -> "The current prototype cannot reliably assess this requirement, so candidate matching was not run.";
        };
    }
}
