package com.procureiq.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class RequirementAnalysisRequest {

    @NotBlank(message = "Requirement is required")
    @Size(max = 10000, message = "Requirement must not exceed 10000 characters")
    private String requirement;

    @Valid
    @Size(max = 30, message = "No more than 30 clarification answers are allowed")
    private List<Answer> answers = new ArrayList<>();

    public String getRequirement() { return requirement; }
    public void setRequirement(String requirement) { this.requirement = requirement; }
    public List<Answer> getAnswers() { return answers; }
    public void setAnswers(List<Answer> answers) { this.answers = answers; }

    public static class Answer {
        @NotBlank
        @Size(max = 100)
        private String questionId;

        @NotBlank
        @Size(max = 100)
        private String optionId;

        @Size(max = 500)
        private String otherText;

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public String getOptionId() { return optionId; }
        public void setOptionId(String optionId) { this.optionId = optionId; }
        public String getOtherText() { return otherText; }
        public void setOtherText(String otherText) { this.otherText = otherText; }
    }
}
