package com.procureiq.dto;

import com.procureiq.entity.CertificationRequirement;
import com.procureiq.entity.StandardRelationship;

import java.util.ArrayList;
import java.util.List;

public class StandardResponse {

    private String isNumber;
    private String title;
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
    private String relatedStandards;
    private String verificationStatus;
    private String dataQualityNote;
    private String sourceUrl;
    private List<CertificationRequirement> certificationRequirements = new ArrayList<>();
    private List<StandardRelationship> relationships = new ArrayList<>();

    public StandardResponse() {
    }

    public String getIsNumber() { return isNumber; }
    public void setIsNumber(String isNumber) { this.isNumber = isNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
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
    public String getRelatedStandards() { return relatedStandards; }
    public void setRelatedStandards(String relatedStandards) { this.relatedStandards = relatedStandards; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getDataQualityNote() { return dataQualityNote; }
    public void setDataQualityNote(String dataQualityNote) { this.dataQualityNote = dataQualityNote; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public List<CertificationRequirement> getCertificationRequirements() { return certificationRequirements; }
    public void setCertificationRequirements(List<CertificationRequirement> certificationRequirements) { this.certificationRequirements = certificationRequirements; }
    public List<StandardRelationship> getRelationships() { return relationships; }
    public void setRelationships(List<StandardRelationship> relationships) { this.relationships = relationships; }
}
