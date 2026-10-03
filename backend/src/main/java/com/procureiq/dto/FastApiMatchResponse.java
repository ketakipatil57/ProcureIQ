package com.procureiq.dto;

import java.util.List;

public class FastApiMatchResponse {

    private List<FastApiStandardResult> results;

    public FastApiMatchResponse() {
    }

    public List<FastApiStandardResult> getResults() { return results; }
    public void setResults(List<FastApiStandardResult> results) { this.results = results; }
}
