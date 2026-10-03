package com.procureiq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RecommendationRequest {

    @NotBlank(message = "Query is required")
    @Size(max = 10000, message = "Query must not exceed 10000 characters")
    private String query;

    public RecommendationRequest() {
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}
