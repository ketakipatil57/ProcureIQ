package com.procureiq.service;

import com.procureiq.dto.TenderAnalysisResponse.ExtractionStatus;
import com.procureiq.repository.StandardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TenderAnalysisServiceTest {

    private final FastApiClient fastApiClient = mock(FastApiClient.class);
    private final RequirementAnalysisService requirementAnalysisService =
            new RequirementAnalysisService(mock(StandardRepository.class));
    private final TenderAnalysisService service =
            new TenderAnalysisService(fastApiClient, requirementAnalysisService);

    @Test
    void analyzesUsablePdfTextAndReportsSupportedMissingAttributes() {
        String extracted = "Electrical cable for supply";
        when(fastApiClient.extractPdfText("tender.pdf", pdfBytes())).thenReturn(extracted);

        var response = service.analyze(pdf());

        assertThat(response.getExtractionStatus()).isEqualTo(ExtractionStatus.SUCCESS);
        assertThat(response.getExtractedText()).isEqualTo(extracted);
        assertThat(response.getAssessment().getProductFamilyId()).isEqualTo("ELECTRICAL_CABLE");
        assertThat(response.getAssessment().getStatus().name()).isEqualTo("AMBIGUOUS");
        assertThat(response.getAssessment().getMaterialMissingAttributes())
                .extracting("attributeId")
                .contains("electrical_cable.design", "electrical_cable.voltage");
    }

    @Test
    void reportsEmptyExtractedPdfTextWithoutCreatingAnAssessment() {
        when(fastApiClient.extractPdfText("tender.pdf", pdfBytes())).thenReturn(" \n ");

        var response = service.analyze(pdf());

        assertThat(response.getExtractionStatus()).isEqualTo(ExtractionStatus.EMPTY);
        assertThat(response.getAssessment()).isNull();
        assertThat(response.getLimitation()).contains("No selectable text");
    }

    @Test
    void reportsUnsupportedProductCoverageWithoutInventingAttributes() {
        when(fastApiClient.extractPdfText("tender.pdf", pdfBytes()))
                .thenReturn("Procure cloud software development services");

        var response = service.analyze(pdf());

        assertThat(response.getExtractionStatus()).isEqualTo(ExtractionStatus.SUCCESS);
        assertThat(response.getAssessment().getStatus().name()).isEqualTo("UNSUPPORTED");
        assertThat(response.getAssessment().getProductFamilyId()).isNull();
        assertThat(response.getAssessment().getIdentifiedSpecifications()).isEmpty();
    }

    @Test
    void reportsExtractionFailureAndDoesNotRunRequirementAssessment() {
        when(fastApiClient.extractPdfText("tender.pdf", pdfBytes()))
                .thenThrow(new FastApiClientException("PDF extraction unavailable", null));

        var response = service.analyze(pdf());

        assertThat(response.getExtractionStatus()).isEqualTo(ExtractionStatus.FAILED);
        assertThat(response.getExtractedText()).isNull();
        assertThat(response.getAssessment()).isNull();
    }

    @Test
    void rejectsInvalidPdfBeforeCallingExtractor() {
        MockMultipartFile invalid = new MockMultipartFile("file", "tender.pdf",
                "application/pdf", "not a pdf".getBytes());

        assertThatThrownBy(() -> service.analyze(invalid))
                .isInstanceOf(ResponseStatusException.class);
        verify(fastApiClient, never()).extractPdfText(org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
    }

    private MockMultipartFile pdf() {
        return new MockMultipartFile("file", "tender.pdf", "application/pdf", pdfBytes());
    }

    private byte[] pdfBytes() {
        return "%PDF-1.7 content".getBytes();
    }
}
