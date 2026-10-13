package com.procureiq.service;

import com.procureiq.dto.RecommendationResponse;
import com.procureiq.dto.RecommendationResult;
import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.dto.RequirementAnalysisResponse.AnalysisStatus;
import com.procureiq.repository.StandardRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExplainableRecommendationServiceTest {

    private final StandardRepository standardRepository = mock(StandardRepository.class);
    private final RecommendationService recommendationService = mock(RecommendationService.class);
    private final RequirementAnalysisService analysisService = new RequirementAnalysisService(standardRepository);
    private final ExplainableRecommendationService service =
            new ExplainableRecommendationService(analysisService, recommendationService);

    @Test
    void matchesUsingLatestInterpretedRequirementAndExplainsOnlyAvailableEvidence() {
        RecommendationResult standard = standard("IS 269:2015", "Ordinary Portland Cement",
                "Specification for ordinary Portland cement", 0.82);
        when(recommendationService.recommend(anyString()))
                .thenReturn(new RecommendationResponse("ignored", List.of(standard)));

        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(answer("cement.type", "ordinary_portland"),
                answer("cement.grade", "grade_43")));

        var response = service.recommend(request);

        assertThat(response.getAssessment().getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(response.getAssessment().getOriginalRequirement()).isEqualTo("Cement for construction");
        assertThat(response.getAssessment().getProvidedAnswers()).hasSize(2);
        assertThat(response.getMatchingQuery()).contains("Ordinary Portland cement", "43 grade");
        verify(recommendationService).recommend(response.getAssessment().getInterpretedRequirement());

        var candidate = response.getCandidates().getFirst();
        assertThat(candidate.getRank()).isEqualTo(1);
        assertThat(candidate.getStandard().getIsNumber()).isEqualTo("IS 269:2015");
        assertThat(candidate.getStandard().getScore()).isEqualTo(0.82);
        assertThat(candidate.getScoreMeaning()).isEqualTo("SEMANTIC_SIMILARITY_NOT_PROBABILITY");
        assertThat(candidate.getRetrievalExplanation()).contains("semantic matching service", "rank 1");
        assertThat(candidate.getMetadataEvidence())
                .anySatisfy(evidence -> assertThat(evidence.getSharedTerms()).contains("cement"));
        assertThat(candidate.getKnownAnswerEvidence()).hasSize(2);
        assertThat(candidate.getKnownAnswerEvidence().getFirst().getMetadataEvidence())
                .anySatisfy(evidence -> assertThat(evidence.getSharedTerms()).contains("cement"));
        assertThat(candidate.isApplicabilityVerified()).isFalse();
    }

    @Test
    void retainsUnknownAndOtherAnswersWithoutUsingThemToResolveOrMatchRequirement() {
        when(recommendationService.recommend(anyString()))
                .thenReturn(new RecommendationResponse("ignored", List.of(standard(
                        "IS 269:2015", "Ordinary Portland Cement", null, 0.9))));
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(
                answer("cement.type", "ordinary_portland"),
                answer("cement.grade", "other", "An unlisted grade")));

        var response = service.recommend(request);

        assertThat(response.getAssessment().getStatus()).isEqualTo(AnalysisStatus.UNCERTAIN);
        assertThat(response.getAssessment().getProvidedAnswers().get(1).getOtherText())
                .isEqualTo("An unlisted grade");
        assertThat(response.getAssessment().getProvidedAnswers().get(1).getInformationStatus())
                .isEqualTo(com.procureiq.dto.RequirementAnalysisResponse.InformationStatus.UNRESOLVED);
        assertThat(response.getAssessment().getInterpretedRequirement()).doesNotContain("An unlisted grade");
        assertThat(response.getMatchingQuery()).isNull();
        assertThat(response.getCandidates()).isEmpty();
        assertThat(response.getStatusExplanation()).contains("Reliable classification was not possible");
        verify(recommendationService, never()).recommend(anyString());
    }

    @Test
    void unresolvedMaterialAnswersRemainProvisionalEvenWithHighSimilarity() {
        when(recommendationService.recommend(anyString()))
                .thenReturn(new RecommendationResponse("ignored", List.of(standard(
                        "IS 269:2015", "Ordinary Portland Cement", null, 0.99))));
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(answer("cement.type", "not_sure")));

        var response = service.recommend(request);

        assertThat(response.getAssessment().getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(response.isCandidateResultsProvisional()).isTrue();
        assertThat(response.getCandidates()).hasSize(1);
        assertThat(response.getCandidates().getFirst().getUnresolvedMaterialDetails())
                .extracting("informationStatus")
                .containsExactly(com.procureiq.dto.RequirementAnalysisResponse.InformationStatus.UNKNOWN);
        assertThat(response.getStatusExplanation()).contains("Candidates are provisional");
        assertThat(response.getCandidates().getFirst().getStandard().getScore()).isEqualTo(0.99);
    }

    @Test
    void returnsSafeStatusForAllAnalysisOutcomesAndDoesNotMatchUnsupportedOrUncertainInputs() {
        when(recommendationService.recommend(anyString()))
                .thenReturn(new RecommendationResponse("", List.of()));
        var clear = service.recommend(withAnswers("Ordinary Portland cement, 43 grade"));
        var ambiguous = service.recommend(request("Cement for construction"));
        verify(recommendationService, times(2)).recommend(anyString());
        clearInvocations(recommendationService);
        var uncertain = service.recommend(request("Need a product for the project"));
        var unsupported = service.recommend(request("Procure a cloud software development service"));

        assertThat(clear.getAssessment().getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(ambiguous.getAssessment().getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(uncertain.getAssessment().getStatus()).isEqualTo(AnalysisStatus.UNCERTAIN);
        assertThat(unsupported.getAssessment().getStatus()).isEqualTo(AnalysisStatus.UNSUPPORTED);
        assertThat(uncertain.getCandidates()).isEmpty();
        assertThat(unsupported.getCandidates()).isEmpty();
        assertThat(uncertain.getStatusExplanation()).contains("not run");
        assertThat(unsupported.getStatusExplanation()).contains("cannot reliably assess");
        verify(recommendationService, never()).recommend(anyString());
    }

    @Test
    void doesNotInventMissingEditionStatusOrCertificationMetadata() {
        when(recommendationService.recommend(anyString()))
                .thenReturn(new RecommendationResponse("ignored", List.of(standard(
                        "IS 269:2015", "Ordinary Portland Cement", null, 0.7))));

        var response = service.recommend(withAnswers("Ordinary Portland cement, 43 grade"));
        var standard = response.getCandidates().getFirst().getStandard();

        assertThat(standard.getEditionYear()).isNull();
        assertThat(standard.getStatus()).isNull();
        assertThat(standard.getCertificationStatus()).isNull();
        assertThat(standard.getCertificationType()).isNull();
        assertThat(standard.getSupersedingIs()).isNull();
        assertThat(standard.getSourceUrl()).isNull();
    }

    @Test
    void refinesElectricalCableRequirementAndReturnsCatalogBackedCandidates() {
        List<RecommendationResult> cableStandards = List.of(
                standard("IS 1554 (Part 1):1988", "PVC Insulated Heavy Duty Electric Cables",
                        "PVC insulated heavy-duty electric cables up to 1100 V", 0.7054),
                standard("IS 694:2010", "PVC Insulated Cables with Rigid and Flexible Conductor",
                        "PVC insulated cables with rigid or flexible conductors up to 1100 V", 0.6429),
                standard("IS 7098 (Part 1):2025", "Crosslinked Polyethylene Insulated Cables",
                        "XLPE insulated thermoplastic sheathed cables up to 1100 V", 0.6133));
        when(recommendationService.recommend(anyString()))
                .thenReturn(new RecommendationResponse("ignored", cableStandards));

        RequirementAnalysisRequest request = request("Electrical cable for power supply");
        request.setAnswers(List.of(
                answer("electrical_cable.design", "pvc_general"),
                answer("electrical_cable.voltage", "up_to_1100v"),
                answer("electrical_cable.conductor", "rigid"),
                answer("reference.is_number", "not_sure")));

        var response = service.recommend(request);

        assertThat(response.getAssessment().getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(response.getAssessment().getProvidedAnswers()).hasSize(4);
        assertThat(response.getAssessment().getProvidedAnswers().getLast().getInformationStatus())
                .isEqualTo(com.procureiq.dto.RequirementAnalysisResponse.InformationStatus.UNKNOWN);
        assertThat(response.getMatchingQuery())
                .contains("electrical_cable.design=PVC general supply/power cable",
                        "electrical_cable.voltage=Up to and including 1100 V",
                        "electrical_cable.conductor=Rigid conductor")
                .doesNotContain("reference.is_number", "not sure");
        verify(recommendationService).recommend(response.getMatchingQuery());
        assertThat(response.getCandidates()).hasSize(3)
                .extracting(candidate -> candidate.getStandard().getIsNumber())
                .containsExactly("IS 1554 (Part 1):1988", "IS 694:2010", "IS 7098 (Part 1):2025");
        assertThat(response.getCandidates().get(1).getMetadataEvidence())
                .anySatisfy(evidence -> assertThat(evidence.getSharedTerms()).contains("pvc"));
        assertThat(response.getCandidates()).allSatisfy(candidate -> {
            assertThat(candidate.getRetrievalExplanation()).contains("semantic matching service");
            assertThat(candidate.isApplicabilityVerified()).isFalse();
        });
    }

    private RequirementAnalysisRequest withAnswers(String requirement) {
        return request(requirement);
    }

    private RequirementAnalysisRequest request(String requirement) {
        RequirementAnalysisRequest request = new RequirementAnalysisRequest();
        request.setRequirement(requirement);
        return request;
    }

    private RequirementAnalysisRequest.Answer answer(String questionId, String optionId) {
        return answer(questionId, optionId, null);
    }

    private RequirementAnalysisRequest.Answer answer(String questionId, String optionId, String otherText) {
        RequirementAnalysisRequest.Answer answer = new RequirementAnalysisRequest.Answer();
        answer.setQuestionId(questionId);
        answer.setOptionId(optionId);
        answer.setOtherText(otherText);
        return answer;
    }

    private RecommendationResult standard(String isNumber, String title, String scope, Double score) {
        RecommendationResult result = new RecommendationResult();
        result.setIsNumber(isNumber);
        result.setTitle(title);
        result.setScopeSummary(scope);
        result.setScore(score);
        return result;
    }
}
