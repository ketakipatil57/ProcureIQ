package com.procureiq.dto;

import java.util.List;

public class RecommendationResult {

    private String isNumber;
    private String title;
    private Double score;
    private String category;
    private String scopeSummary;
    private Integer editionYear;
    private String status;
    private String supersedingIs;
    private String amendmentCount;
    private String latestAmendmentNote;
    private String certificationStatus;
    private String certificationType;
    private String qcoReference;
    private String verificationStatus;
    private String sourceUrl;
    private List<CertificationRequirementInfo> certificationRequirements;
    private List<RelationshipInfo> relationships;

    public RecommendationResult() {
    }

    public String getIsNumber() { return isNumber; }
    public void setIsNumber(String isNumber) { this.isNumber = isNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getScopeSummary() { return scopeSummary; }
    public void setScopeSummary(String scopeSummary) { this.scopeSummary = scopeSummary; }
    public Integer getEditionYear() { return editionYear; }
    public void setEditionYear(Integer editionYear) { this.editionYear = editionYear; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSupersedingIs() { return supersedingIs; }
    public void setSupersedingIs(String supersedingIs) { this.supersedingIs = supersedingIs; }
    public String getAmendmentCount() { return amendmentCount; }
    public void setAmendmentCount(String amendmentCount) { this.amendmentCount = amendmentCount; }
    public String getLatestAmendmentNote() { return latestAmendmentNote; }
    public void setLatestAmendmentNote(String latestAmendmentNote) { this.latestAmendmentNote = latestAmendmentNote; }
    public String getCertificationStatus() { return certificationStatus; }
    public void setCertificationStatus(String certificationStatus) { this.certificationStatus = certificationStatus; }
    public String getCertificationType() { return certificationType; }
    public void setCertificationType(String certificationType) { this.certificationType = certificationType; }
    public String getQcoReference() { return qcoReference; }
    public void setQcoReference(String qcoReference) { this.qcoReference = qcoReference; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public List<CertificationRequirementInfo> getCertificationRequirements() { return certificationRequirements; }
    public void setCertificationRequirements(List<CertificationRequirementInfo> certificationRequirements) { this.certificationRequirements = certificationRequirements; }
    public List<RelationshipInfo> getRelationships() { return relationships; }
    public void setRelationships(List<RelationshipInfo> relationships) { this.relationships = relationships; }

    public static class CertificationRequirementInfo {
        private Long certificationId;
        private String isNumber;
        private String certificationType;
        private String requirementStatus;
        private String requirementDescription;
        private String qcoReference;
        private String sourceUrl;

        public CertificationRequirementInfo() {
        }

        public Long getCertificationId() { return certificationId; }
        public void setCertificationId(Long certificationId) { this.certificationId = certificationId; }
        public String getIsNumber() { return isNumber; }
        public void setIsNumber(String isNumber) { this.isNumber = isNumber; }
        public String getCertificationType() { return certificationType; }
        public void setCertificationType(String certificationType) { this.certificationType = certificationType; }
        public String getRequirementStatus() { return requirementStatus; }
        public void setRequirementStatus(String requirementStatus) { this.requirementStatus = requirementStatus; }
        public String getRequirementDescription() { return requirementDescription; }
        public void setRequirementDescription(String requirementDescription) { this.requirementDescription = requirementDescription; }
        public String getQcoReference() { return qcoReference; }
        public void setQcoReference(String qcoReference) { this.qcoReference = qcoReference; }
        public String getSourceUrl() { return sourceUrl; }
        public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    }

    public static class RelationshipInfo {
        private Long relationshipId;
        private String sourceIsNumber;
        private String targetIsNumber;
        private String relationshipType;
        private String description;
        private String sourceUrl;

        public RelationshipInfo() {
        }

        public Long getRelationshipId() { return relationshipId; }
        public void setRelationshipId(Long relationshipId) { this.relationshipId = relationshipId; }
        public String getSourceIsNumber() { return sourceIsNumber; }
        public void setSourceIsNumber(String sourceIsNumber) { this.sourceIsNumber = sourceIsNumber; }
        public String getTargetIsNumber() { return targetIsNumber; }
        public void setTargetIsNumber(String targetIsNumber) { this.targetIsNumber = targetIsNumber; }
        public String getRelationshipType() { return relationshipType; }
        public void setRelationshipType(String relationshipType) { this.relationshipType = relationshipType; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getSourceUrl() { return sourceUrl; }
        public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    }
}
