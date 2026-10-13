package com.procureiq.dto;

import com.procureiq.dto.RequirementAnalysisResponse.AnalysisStatus;
import com.procureiq.dto.RequirementAnalysisResponse.MaterialAttribute;
import com.procureiq.dto.RequirementAnalysisResponse.ProvidedAnswer;

import java.util.ArrayList;
import java.util.List;

public class ExplainableRecommendationResponse {

    private RequirementAnalysisResponse assessment;
    private String matchingQuery;
    private String statusExplanation;
    private boolean candidateResultsProvisional = true;
    private List<Candidate> candidates = new ArrayList<>();

    public RequirementAnalysisResponse getAssessment() { return assessment; }
    public void setAssessment(RequirementAnalysisResponse assessment) { this.assessment = assessment; }
    public String getMatchingQuery() { return matchingQuery; }
    public void setMatchingQuery(String matchingQuery) { this.matchingQuery = matchingQuery; }
    public String getStatusExplanation() { return statusExplanation; }
    public void setStatusExplanation(String statusExplanation) { this.statusExplanation = statusExplanation; }
    public boolean isCandidateResultsProvisional() { return candidateResultsProvisional; }
    public void setCandidateResultsProvisional(boolean candidateResultsProvisional) {
        this.candidateResultsProvisional = candidateResultsProvisional;
    }
    public List<Candidate> getCandidates() { return candidates; }
    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }

    public static class Candidate {
        private int rank;
        private RecommendationResult standard;
        private String retrievalExplanation;
        private String scoreMeaning = "SEMANTIC_SIMILARITY_NOT_PROBABILITY";
        private boolean applicabilityVerified;
        private List<MetadataEvidence> metadataEvidence = new ArrayList<>();
        private List<ClarificationEvidence> knownAnswerEvidence = new ArrayList<>();
        private List<MaterialAttribute> unresolvedMaterialDetails = new ArrayList<>();

        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }
        public RecommendationResult getStandard() { return standard; }
        public void setStandard(RecommendationResult standard) { this.standard = standard; }
        public String getRetrievalExplanation() { return retrievalExplanation; }
        public void setRetrievalExplanation(String retrievalExplanation) { this.retrievalExplanation = retrievalExplanation; }
        public String getScoreMeaning() { return scoreMeaning; }
        public void setScoreMeaning(String scoreMeaning) { this.scoreMeaning = scoreMeaning; }
        public boolean isApplicabilityVerified() { return applicabilityVerified; }
        public void setApplicabilityVerified(boolean applicabilityVerified) {
            this.applicabilityVerified = applicabilityVerified;
        }
        public List<MetadataEvidence> getMetadataEvidence() { return metadataEvidence; }
        public void setMetadataEvidence(List<MetadataEvidence> metadataEvidence) { this.metadataEvidence = metadataEvidence; }
        public List<ClarificationEvidence> getKnownAnswerEvidence() { return knownAnswerEvidence; }
        public void setKnownAnswerEvidence(List<ClarificationEvidence> knownAnswerEvidence) {
            this.knownAnswerEvidence = knownAnswerEvidence;
        }
        public List<MaterialAttribute> getUnresolvedMaterialDetails() { return unresolvedMaterialDetails; }
        public void setUnresolvedMaterialDetails(List<MaterialAttribute> unresolvedMaterialDetails) {
            this.unresolvedMaterialDetails = unresolvedMaterialDetails;
        }
    }

    public static class MetadataEvidence {
        private String sourceField;
        private List<String> sharedTerms = new ArrayList<>();

        public MetadataEvidence() {
        }

        public MetadataEvidence(String sourceField, List<String> sharedTerms) {
            this.sourceField = sourceField;
            this.sharedTerms = sharedTerms;
        }

        public String getSourceField() { return sourceField; }
        public void setSourceField(String sourceField) { this.sourceField = sourceField; }
        public List<String> getSharedTerms() { return sharedTerms; }
        public void setSharedTerms(List<String> sharedTerms) { this.sharedTerms = sharedTerms; }
    }

    public static class ClarificationEvidence {
        private String questionId;
        private String optionId;
        private String interpretedValue;
        private List<MetadataEvidence> metadataEvidence = new ArrayList<>();

        public ClarificationEvidence() {
        }

        public ClarificationEvidence(ProvidedAnswer answer, List<MetadataEvidence> metadataEvidence) {
            this.questionId = answer.getQuestionId();
            this.optionId = answer.getOptionId();
            this.interpretedValue = answer.getInterpretedValue();
            this.metadataEvidence = metadataEvidence;
        }

        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public String getOptionId() { return optionId; }
        public void setOptionId(String optionId) { this.optionId = optionId; }
        public String getInterpretedValue() { return interpretedValue; }
        public void setInterpretedValue(String interpretedValue) { this.interpretedValue = interpretedValue; }
        public List<MetadataEvidence> getMetadataEvidence() { return metadataEvidence; }
        public void setMetadataEvidence(List<MetadataEvidence> metadataEvidence) {
            this.metadataEvidence = metadataEvidence;
        }
    }
}
