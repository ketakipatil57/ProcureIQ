package com.procureiq.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FastApiStandardResult {

    @JsonProperty("is_number")
    private String isNumber;

    private String title;
    private Double score;

    public FastApiStandardResult() {
    }

    public String getIsNumber() { return isNumber; }
    public void setIsNumber(String isNumber) { this.isNumber = isNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
}
