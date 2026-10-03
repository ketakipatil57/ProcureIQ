package com.procureiq.dto;

import java.util.List;

public class RecommendationResponse {

    private String query;
    private List<RecommendationResult> results;

    public RecommendationResponse() {
    }

    public RecommendationResponse(String query, List<RecommendationResult> results) {
        this.query = query;
        this.results = results;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<RecommendationResult> getResults() { return results; }
    public void setResults(List<RecommendationResult> results) { this.results = results; }
}
