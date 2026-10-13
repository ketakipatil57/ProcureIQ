package com.procureiq.service;

import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.dto.RequirementAnalysisResponse;
import com.procureiq.dto.TenderAnalysisResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class TenderAnalysisService {

    private static final long MAX_PDF_SIZE_BYTES = 10L * 1024 * 1024;
    private static final int MAX_ANALYSIS_TEXT_LENGTH = 10_000;

    private final FastApiClient fastApiClient;
    private final RequirementAnalysisService requirementAnalysisService;

    public TenderAnalysisService(FastApiClient fastApiClient,
                                 RequirementAnalysisService requirementAnalysisService) {
        this.fastApiClient = fastApiClient;
        this.requirementAnalysisService = requirementAnalysisService;
    }

    public TenderAnalysisResponse analyze(MultipartFile file) {
        byte[] pdfBytes = validatedPdfBytes(file);
        String fileName = file.getOriginalFilename();
        String extractedText;
        try {
            extractedText = fastApiClient.extractPdfText(fileName, pdfBytes);
        } catch (FastApiClientException exception) {
            return new TenderAnalysisResponse(fileName, TenderAnalysisResponse.ExtractionStatus.FAILED,
                    null, null, "Text extraction failed. The tender cannot be assessed.");
        }

        if (extractedText.isBlank()) {
            return new TenderAnalysisResponse(fileName, TenderAnalysisResponse.ExtractionStatus.EMPTY,
                    "", null, "No selectable text was extracted. OCR is not available in this prototype.");
        }
        if (extractedText.length() > MAX_ANALYSIS_TEXT_LENGTH) {
            return new TenderAnalysisResponse(fileName, TenderAnalysisResponse.ExtractionStatus.TOO_LONG,
                    extractedText, null,
                    "Extracted text exceeds the 10000-character requirement-analysis limit. No partial assessment was made.");
        }

        RequirementAnalysisRequest request = new RequirementAnalysisRequest();
        request.setRequirement(extractedText);
        RequirementAnalysisResponse assessment = requirementAnalysisService.analyze(request);
        return new TenderAnalysisResponse(fileName, TenderAnalysisResponse.ExtractionStatus.SUCCESS,
                extractedText, assessment, null);
    }

    private byte[] validatedPdfBytes(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A PDF file is required");
        }
        if (file.getSize() > MAX_PDF_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF file must not exceed 10 MB");
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded PDF", exception);
        }
        byte[] signature = "%PDF-".getBytes(StandardCharsets.US_ASCII);
        int maxStart = Math.min(content.length - signature.length, 1024);
        for (int start = 0; start <= maxStart; start++) {
            boolean matches = true;
            for (int index = 0; index < signature.length; index++) {
                if (content[start + index] != signature[index]) {
                    matches = false;
                    break;
                }
            }
            if (matches) return content;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is not a valid PDF");
    }
}
