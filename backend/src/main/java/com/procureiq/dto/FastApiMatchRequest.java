package com.procureiq.dto;

public class FastApiMatchRequest {

    private String text;

    public FastApiMatchRequest() {
    }

    public FastApiMatchRequest(String text) {
        this.text = text;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
