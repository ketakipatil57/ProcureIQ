package com.procureiq.dto;

public class TenderAnalysisResponse {

    private String fileName;
    private ExtractionStatus extractionStatus;
    private String extractedText;
    private RequirementAnalysisResponse assessment;
    private String limitation;

    public TenderAnalysisResponse() {
    }

    public TenderAnalysisResponse(String fileName, ExtractionStatus extractionStatus, String extractedText,
                                  RequirementAnalysisResponse assessment, String limitation) {
        this.fileName = fileName;
        this.extractionStatus = extractionStatus;
        this.extractedText = extractedText;
        this.assessment = assessment;
        this.limitation = limitation;
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public ExtractionStatus getExtractionStatus() { return extractionStatus; }
    public void setExtractionStatus(ExtractionStatus extractionStatus) { this.extractionStatus = extractionStatus; }
    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }
    public RequirementAnalysisResponse getAssessment() { return assessment; }
    public void setAssessment(RequirementAnalysisResponse assessment) { this.assessment = assessment; }
    public String getLimitation() { return limitation; }
    public void setLimitation(String limitation) { this.limitation = limitation; }

    public enum ExtractionStatus {
        SUCCESS,
        EMPTY,
        TOO_LONG,
        FAILED
    }
}
