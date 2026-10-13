package com.procureiq.service;

import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.dto.RequirementAnalysisRequest.Answer;
import com.procureiq.dto.RequirementAnalysisResponse.AnalysisStatus;
import com.procureiq.dto.RequirementAnalysisResponse.InformationStatus;
import com.procureiq.repository.StandardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RequirementAnalysisServiceTest {

    private final StandardRepository standardRepository = mock(StandardRepository.class);
    private final RequirementAnalysisService service = new RequirementAnalysisService(standardRepository);

    @Test
    void classifiesRequirementWithRelevantCementAttributesAsClear() {
        var response = service.analyze(request("Ordinary Portland cement, 43 grade"));

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(response.getMaterialMissingAttributes()).isEmpty();
        assertThat(response.getClarificationQuestions()).isEmpty();
    }

    @Test
    void doesNotAskForAnAttributeThatDoesNotDistinguishTheMatchedCementFamily() {
        var response = service.analyze(request("Portland pozzolana cement for construction"));

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(response.getMaterialMissingAttributes()).isEmpty();
    }

    @Test
    void asksTargetedQuestionsForMateriallyAmbiguousCementType() {
        var response = service.analyze(request("Cement for construction"));

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(response.getMaterialMissingAttributes())
                .extracting("attributeId", "informationStatus")
                .containsExactly(org.assertj.core.groups.Tuple.tuple("cement.type", InformationStatus.UNANSWERED));
        assertThat(response.getClarificationQuestions())
                .extracting("id")
                .containsExactly("cement.type", "cement.application", "reference.is_number");
        assertThat(response.getClarificationQuestions().getFirst().getOptions())
                .extracting("id")
                .contains("not_sure", "other");
        assertThat(response.getClarificationQuestions().getFirst().getOptions())
                .filteredOn("id", "other")
                .singleElement()
                .extracting("otherTextAllowed")
                .isEqualTo(true);
    }

    @Test
    void recordsNotSureAsUnknownAndKeepsRequirementAmbiguous() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(answer("cement.type", "not_sure", null)));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(response.getProvidedAnswers().getFirst().getInformationStatus())
                .isEqualTo(InformationStatus.UNKNOWN);
        assertThat(response.getInterpretedRequirement()).isEqualTo("Cement for construction");
        assertThat(response.getMaterialMissingAttributes().getFirst().getInformationStatus())
                .isEqualTo(InformationStatus.UNKNOWN);
        assertThat(response.getClarificationQuestions())
                .extracting("id")
                .contains("cement.type", "cement.application", "reference.is_number");
    }

    @Test
    void reassessesKnownTypeAndKeepsUnansweredGradeAmbiguous() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(answer("cement.type", "ordinary_portland", null)));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(response.getMaterialMissingAttributes())
                .extracting("attributeId", "informationStatus")
                .containsExactly(org.assertj.core.groups.Tuple.tuple("cement.grade", InformationStatus.UNANSWERED));
        assertThat(response.getClarificationQuestions())
                .extracting("id")
                .containsExactly("cement.type", "cement.grade", "cement.application", "reference.is_number");
        assertThat(response.getInterpretedRequirement()).contains("Ordinary Portland cement");
    }

    @Test
    void reassessesKnownClarificationsWithoutTreatingConfirmationAsVerification() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(
                answer("cement.type", "ordinary_portland", null),
                answer("cement.grade", "grade_43", null)));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(response.getMaterialMissingAttributes()).isEmpty();
        assertThat(response.getInterpretedRequirement()).contains("Ordinary Portland cement", "43 grade");
        assertThat(response.getInterpretationDisclosureKey())
                .isEqualTo("requirement.confirmation_is_not_verification");
    }

    @Test
    void doesNotTreatFreeTextOtherAsAnInterpretedTechnicalValue() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(answer("cement.type", "other", "A blend not listed in the options")));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.UNCERTAIN);
        assertThat(response.getMaterialMissingAttributes().getFirst().getInformationStatus())
                .isEqualTo(InformationStatus.UNRESOLVED);
        assertThat(response.getClarificationQuestions())
                .extracting("id")
                .contains("cement.type", "cement.application", "reference.is_number");
        assertThat(response.getInterpretedRequirement()).doesNotContain("A blend not listed in the options");
        assertThat(response.getProvidedAnswers().getFirst().getOtherText())
                .isEqualTo("A blend not listed in the options");
        assertThat(response.getProvidedAnswers().getFirst().getInterpretedValue()).isNull();
    }

    @Test
    void reportsExplicitServiceCategoryOutsideProductRuleCoverageAsUnsupported() {
        var response = service.analyze(request("Procure a cloud software development service"));

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.UNSUPPORTED);
        assertThat(response.getReasons()).extracting("code")
                .containsExactly("requirement.explicitly_out_of_coverage");
    }

    @Test
    void reportsUnrecognizedProductFamilyAsUncertainNotUnsupported() {
        var response = service.analyze(request("Need a product for the project"));

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.UNCERTAIN);
        assertThat(response.getReasons()).extracting("code")
                .containsExactly("requirement.product_family_unrecognized");
    }

    @Test
    void treatsCableVoltageAsMaterialAndLimitsClearToRepresentedRange() {
        var ambiguous = service.analyze(request("XLPE cable"));
        var clear = service.analyze(request("XLPE cable rated at 1100 V"));
        var unsupported = service.analyze(request("XLPE cable rated above 1100 V"));

        assertThat(ambiguous.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(ambiguous.getClarificationQuestions()).extracting("id")
                .containsExactly("electrical_cable.voltage", "electrical_cable.conductor", "reference.is_number");
        assertThat(clear.getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(unsupported.getStatus()).isEqualTo(AnalysisStatus.UNSUPPORTED);
    }

    @Test
    void reportsExplicitlyDetectedCableSpecificationsSeparatelyFromMissingAttributes() {
        var response = service.analyze(request(
                "PVC general supply power cable rated up to and including 1100 V with rigid conductor"));

        assertThat(response.getIdentifiedSpecifications())
                .extracting("attributeId", "value")
                .contains(
                        org.assertj.core.groups.Tuple.tuple("electrical_cable.design", "PVC general supply/power cable"),
                        org.assertj.core.groups.Tuple.tuple("electrical_cable.voltage", "Up to and including 1100 V"),
                        org.assertj.core.groups.Tuple.tuple("electrical_cable.conductor", "Rigid conductor"));
    }

    @Test
    void exposesProductSpecificQuestionsOnlyWhereCorpusProvidesRelevantScopeAttributes() {
        var cable = service.analyze(request("Electrical cable"));
        var extinguisher = service.analyze(request("Fire extinguisher"));
        var foodPlastic = service.analyze(request("Food contact plastic"));
        var helmet = service.analyze(request("Helmet"));

        assertThat(cable.getClarificationQuestions()).extracting("id")
                .containsExactly("electrical_cable.design", "electrical_cable.voltage",
                        "electrical_cable.conductor", "reference.is_number");
        assertThat(extinguisher.getClarificationQuestions()).extracting("id")
                .containsExactly("fire_extinguisher.medium", "fire_extinguisher.form", "reference.is_number");
        assertThat(foodPlastic.getClarificationQuestions()).extracting("id")
                .containsExactly("food_contact_plastic.material",
                        "food_contact_plastic.product_form", "reference.is_number");
        assertThat(helmet.getClarificationQuestions()).extracting("id")
                .containsExactly("helmet.use", "reference.is_number");
        assertThat(cable.getClarificationQuestions().get(2).isMaterial()).isFalse();
        assertThat(cable.getClarificationQuestions().get(2).getOptions())
                .filteredOn("id", "other")
                .singleElement()
                .extracting("otherTextAllowed")
                .isEqualTo(true);
    }

    @Test
    void reassessesAllSubmittedAnswersAndKeepsUnknownAnswersUnresolved() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(
                answer("cement.type", "ordinary_portland", null),
                answer("cement.grade", "grade_43", null),
                answer("cement.application", "not_sure", null)));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(response.getProvidedAnswers()).hasSize(3);
        assertThat(response.getProvidedAnswers().get(2).getInformationStatus())
                .isEqualTo(InformationStatus.UNKNOWN);
        assertThat(response.getInterpretedRequirement()).doesNotContain("cement.application");
    }

    @Test
    void databaseLookupDoesNotTreatUserSuppliedIsNumberAsEvidenceOfApplicability() {
        when(standardRepository.existsById("IS 269:2015")).thenReturn(true);
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(
                answer("cement.type", "not_sure", null),
                answer("reference.is_number", "is_number_provided", "IS 269:2015")));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(response.getUserProvidedStandardReference()).isEqualTo("IS 269:2015");
        assertThat(response.getStandardReferenceVerificationStatus()).isEqualTo("FOUND_IN_DATABASE");
        assertThat(response.getStandardReferenceApplicabilityStatus()).isEqualTo("NOT_ASSESSED");
        assertThat(response.getInterpretedRequirement()).doesNotContain("IS 269:2015");
        assertThat(response.getProvidedAnswers().get(1).getInformationStatus())
                .isEqualTo(InformationStatus.UNRESOLVED);
        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
    }

    @Test
    void reportsUnknownIsReferenceWithoutResolvingRequirement() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(
                answer("cement.type", "not_sure", null),
                answer("reference.is_number", "is_number_provided", "IS 00000:1900")));

        var response = service.analyze(request);

        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(response.getStandardReferenceVerificationStatus()).isEqualTo("NOT_FOUND_IN_DATABASE");
        assertThat(response.getStandardReferenceApplicabilityStatus()).isEqualTo("NOT_ASSESSED");
    }

    @Test
    void recognizesSupportedMarathiAndHindiProductTerms() {
        var marathi = service.analyze(request("औद्योगिक हेलमेट"));
        var hindi = service.analyze(request("सीमेंट"));

        assertThat(marathi.getStatus()).isEqualTo(AnalysisStatus.CLEAR);
        assertThat(marathi.getProductFamilyId()).isEqualTo("HELMET");
        assertThat(hindi.getStatus()).isEqualTo(AnalysisStatus.AMBIGUOUS);
        assertThat(hindi.getClarificationQuestions()).extracting("id")
                .containsExactly("cement.type", "cement.application", "reference.is_number");
    }

    @Test
    void rejectsAnswersForUnknownQuestionOrOption() {
        RequirementAnalysisRequest request = request("Cement for construction");
        request.setAnswers(List.of(answer("cement.type", "unlisted_option", null)));

        assertThatThrownBy(() -> service.analyze(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Unknown clarification question or answer option");
    }

    private RequirementAnalysisRequest request(String requirement) {
        RequirementAnalysisRequest request = new RequirementAnalysisRequest();
        request.setRequirement(requirement);
        return request;
    }

    private Answer answer(String questionId, String optionId, String otherText) {
        Answer answer = new Answer();
        answer.setQuestionId(questionId);
        answer.setOptionId(optionId);
        answer.setOtherText(otherText);
        return answer;
    }
}
