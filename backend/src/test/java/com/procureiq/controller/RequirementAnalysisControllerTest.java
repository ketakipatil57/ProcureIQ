package com.procureiq.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procureiq.dto.PdfRecommendationResponse;
import com.procureiq.dto.RecommendationResponse;
import com.procureiq.repository.StandardRepository;
import com.procureiq.service.ExplainableRecommendationService;
import com.procureiq.service.FastApiClientException;
import com.procureiq.service.FastApiClient;
import com.procureiq.service.RecommendationService;
import com.procureiq.service.RequirementAnalysisService;
import com.procureiq.service.TenderAnalysisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RequirementAnalysisControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RecommendationService recommendationService = mock(RecommendationService.class);
    private final FastApiClient fastApiClient = mock(FastApiClient.class);
    private final StandardRepository standardRepository = mock(StandardRepository.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new RequirementAnalysisController(new RequirementAnalysisService(standardRepository)),
                        new ExplainableRecommendationController(new ExplainableRecommendationService(
                                new RequirementAnalysisService(standardRepository), recommendationService)),
                        new TenderAnalysisController(new TenderAnalysisService(fastApiClient,
                                new RequirementAnalysisService(standardRepository))),
                        new RecommendationController(recommendationService))
                .setValidator(validator)
                .build();
    }

    @Test
    void acceptsValidAnalysisRequestAndReturnsQuestionContract() throws Exception {
        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AMBIGUOUS"))
                .andExpect(jsonPath("$.originalRequirement").value("Cement for construction"))
                .andExpect(jsonPath("$.materialMissingAttributes[0].informationStatus").value("UNANSWERED"))
                .andExpect(jsonPath("$.clarificationQuestions[0].id").value("cement.type"))
                .andExpect(jsonPath("$.clarificationQuestions.length()").value(3))
                .andExpect(jsonPath("$.clarificationQuestions[0].options[4].id").value("not_sure"))
                .andExpect(jsonPath("$.providedAnswers").isEmpty());
    }

    @Test
    void rejectsInvalidRequirementAndInvalidNestedAnswerFields() throws Exception {
        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":" "}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction","answers":[{"questionId":"","optionId":"not_sure"}]}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsDuplicateAnswersForOneQuestion() throws Exception {
        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction","answers":[
                                  {"questionId":"cement.type","optionId":"ordinary_portland"},
                                  {"questionId":"cement.type","optionId":"pozzolana"}
                                ]}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownQuestionAndUnknownOptionIds() throws Exception {
        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction","answers":[{"questionId":"cement.grade","optionId":"grade_43"}]}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction","answers":[{"questionId":"cement.type","optionId":"grade_43"}]}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void preservesSubmittedAnswerInUnsupportedResponse() throws Exception {
        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Electrical cable rated above 1100 V","answers":[{"questionId":"electrical_cable.design","optionId":"not_sure"}]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNSUPPORTED"))
                .andExpect(jsonPath("$.originalRequirement").value("Electrical cable rated above 1100 V"))
                .andExpect(jsonPath("$.interpretedRequirement").value("Electrical cable rated above 1100 V"))
                .andExpect(jsonPath("$.providedAnswers[0].questionId").value("electrical_cable.design"))
                .andExpect(jsonPath("$.providedAnswers[0].optionId").value("not_sure"))
                .andExpect(jsonPath("$.providedAnswers[0].informationStatus").value("UNKNOWN"));
    }

    @Test
    void acceptsOptionalIsNumberReferenceWithoutMarkingItVerified() throws Exception {
        when(standardRepository.existsById("IS 269:2015")).thenReturn(true);
        mockMvc.perform(post("/api/requirements/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction","answers":[
                                  {"questionId":"reference.is_number","optionId":"is_number_provided","otherText":"IS 269:2015"},
                                  {"questionId":"cement.type","optionId":"not_sure"}
                                ]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AMBIGUOUS"))
                .andExpect(jsonPath("$.userProvidedStandardReference").value("IS 269:2015"))
                .andExpect(jsonPath("$.standardReferenceVerificationStatus").value("FOUND_IN_DATABASE"))
                .andExpect(jsonPath("$.standardReferenceApplicabilityStatus").value("NOT_ASSESSED"))
                .andExpect(jsonPath("$.interpretedRequirement").value("Cement for construction"));
    }

    @Test
    void exposesRefinedAssessmentAndCandidateEvidenceWithoutChangingLegacyContracts() throws Exception {
        when(recommendationService.recommend(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(new RecommendationResponse("ignored", List.of()));

        mockMvc.perform(post("/api/requirements/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction","answers":[
                                  {"questionId":"cement.type","optionId":"ordinary_portland"},
                                  {"questionId":"cement.grade","optionId":"grade_43"}
                                ]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assessment.status").value("CLEAR"))
                .andExpect(jsonPath("$.assessment.originalRequirement").value("Cement for construction"))
                .andExpect(jsonPath("$.assessment.providedAnswers.length()").value(2))
                .andExpect(jsonPath("$.matchingQuery").value(org.hamcrest.Matchers.containsString("43 grade")))
                .andExpect(jsonPath("$.candidateResultsProvisional").value(true))
                .andExpect(jsonPath("$.candidates").isArray())
                .andExpect(jsonPath("$.statusExplanation").value(
                        org.hamcrest.Matchers.containsString("does not establish standard applicability")));
    }

    @Test
    void reportsSemanticMatcherFailuresAsBadGateway() throws Exception {
        when(recommendationService.recommend(org.mockito.ArgumentMatchers.anyString()))
                .thenThrow(new FastApiClientException("FastAPI is unavailable", null));

        mockMvc.perform(post("/api/requirements/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction"}
                                """))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("FastAPI is unavailable"));
    }

    @Test
    void preservesLegacyTextRecommendationEndpointContractAndDelegation() throws Exception {
        when(recommendationService.recommend("cement request"))
                .thenReturn(new RecommendationResponse("cement request", List.of()));

        mockMvc.perform(post("/api/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"query":"cement request"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("cement request"))
                .andExpect(jsonPath("$.results").isArray());

        verify(recommendationService).recommend("cement request");
    }

    @Test
    void preservesLegacyPdfRecommendationEndpointContractAndDelegation() throws Exception {
        when(recommendationService.recommendPdf(any()))
                .thenReturn(new PdfRecommendationResponse("tender.pdf", List.of()));
        MockMultipartFile file = new MockMultipartFile("file", "tender.pdf",
                MediaType.APPLICATION_PDF_VALUE, "%PDF-1.7".getBytes());

        mockMvc.perform(multipart("/api/recommendations/pdf").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("tender.pdf"))
                .andExpect(jsonPath("$.results").isArray());

        verify(recommendationService).recommendPdf(any());
    }

    @Test
    void tenderAnalysisExtractsOnceAndReturnsCompletenessAssessment() throws Exception {
        byte[] pdfBytes = "%PDF-1.7".getBytes();
        when(fastApiClient.extractPdfText(org.mockito.ArgumentMatchers.eq("cable-tender.pdf"), any()))
                .thenReturn("Electrical cable for power supply");
        MockMultipartFile file = new MockMultipartFile("file", "cable-tender.pdf",
                MediaType.APPLICATION_PDF_VALUE, pdfBytes);

        mockMvc.perform(multipart("/api/requirements/tender-analysis").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.extractionStatus").value("SUCCESS"))
                .andExpect(jsonPath("$.extractedText").value("Electrical cable for power supply"))
                .andExpect(jsonPath("$.assessment.productFamilyId").value("ELECTRICAL_CABLE"))
                .andExpect(jsonPath("$.assessment.status").value("AMBIGUOUS"))
                .andExpect(jsonPath("$.assessment.materialMissingAttributes.length()").value(2));

        verify(fastApiClient).extractPdfText(org.mockito.ArgumentMatchers.eq("cable-tender.pdf"), any());
    }
}
