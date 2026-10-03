package com.procureiq.dto;

import java.util.List;

public class PdfRecommendationResponse {

    private String fileName;
    private List<RecommendationResult> results;

    public PdfRecommendationResponse() {
    }

    public PdfRecommendationResponse(String fileName, List<RecommendationResult> results) {
        this.fileName = fileName;
        this.results = results;
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public List<RecommendationResult> getResults() { return results; }
    public void setResults(List<RecommendationResult> results) { this.results = results; }
}
