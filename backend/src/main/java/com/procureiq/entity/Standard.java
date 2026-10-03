package com.procureiq.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "standards")
public class Standard {

    @Id
    @Column(name = "is_number", nullable = false, length = 50)
    private String isNumber;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "scope_summary", columnDefinition = "TEXT")
    private String scopeSummary;

    @Column(name = "semantic_keywords", length = 255)
    private String semanticKeywords;

    @Column(name = "search_text", columnDefinition = "TEXT")
    private String searchText;

    @Column(name = "edition_year")
    private Integer editionYear;

    @Column(name = "status", length = 100)
    private String status;

    @Column(name = "superseding_is", length = 100)
    private String supersedingIs;

    @Column(name = "amendment_count", length = 100)
    private String amendmentCount;

    @Column(name = "latest_amendment_note", length = 255)
    private String latestAmendmentNote;

    @Column(name = "certification_status", length = 100)
    private String certificationStatus;

    @Column(name = "certification_type", length = 255)
    private String certificationType;

    @Column(name = "qco_reference", length = 255)
    private String qcoReference;

    @Column(name = "related_standards", length = 255)
    private String relatedStandards;

    @Column(name = "verification_status", length = 50)
    private String verificationStatus;

    @Column(name = "data_quality_note", length = 255)
    private String dataQualityNote;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    public Standard() {
    }

    public Standard(String isNumber, String title, String category, String scopeSummary,
                    String semanticKeywords, String searchText, Integer editionYear, String status,
                    String supersedingIs, String amendmentCount, String latestAmendmentNote,
                    String certificationStatus, String certificationType, String qcoReference,
                    String relatedStandards, String verificationStatus, String dataQualityNote,
                    String sourceUrl) {
        this.isNumber = isNumber;
        this.title = title;
        this.category = category;
        this.scopeSummary = scopeSummary;
        this.semanticKeywords = semanticKeywords;
        this.searchText = searchText;
        this.editionYear = editionYear;
        this.status = status;
        this.supersedingIs = supersedingIs;
        this.amendmentCount = amendmentCount;
        this.latestAmendmentNote = latestAmendmentNote;
        this.certificationStatus = certificationStatus;
        this.certificationType = certificationType;
        this.qcoReference = qcoReference;
        this.relatedStandards = relatedStandards;
        this.verificationStatus = verificationStatus;
        this.dataQualityNote = dataQualityNote;
        this.sourceUrl = sourceUrl;
    }

    public String getIsNumber() { return isNumber; }
    public void setIsNumber(String isNumber) { this.isNumber = isNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getScopeSummary() { return scopeSummary; }
    public void setScopeSummary(String scopeSummary) { this.scopeSummary = scopeSummary; }
    public String getSemanticKeywords() { return semanticKeywords; }
    public void setSemanticKeywords(String semanticKeywords) { this.semanticKeywords = semanticKeywords; }
    public String getSearchText() { return searchText; }
    public void setSearchText(String searchText) { this.searchText = searchText; }
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
}
