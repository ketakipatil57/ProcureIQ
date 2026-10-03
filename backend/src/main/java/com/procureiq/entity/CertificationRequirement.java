package com.procureiq.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "certification_requirements")
public class CertificationRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "certification_id", nullable = false)
    private Long certificationId;

    @Column(name = "is_number", nullable = false, length = 50)
    private String isNumber;

    @Column(name = "certification_type", length = 255)
    private String certificationType;

    @Column(name = "requirement_status", length = 100)
    private String requirementStatus;

    @Column(name = "requirement_description", columnDefinition = "TEXT")
    private String requirementDescription;

    @Column(name = "qco_reference", length = 255)
    private String qcoReference;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    public CertificationRequirement() {
    }

    public CertificationRequirement(Long certificationId, String isNumber, String certificationType,
                                    String requirementStatus, String requirementDescription,
                                    String qcoReference, String sourceUrl) {
        this.certificationId = certificationId;
        this.isNumber = isNumber;
        this.certificationType = certificationType;
        this.requirementStatus = requirementStatus;
        this.requirementDescription = requirementDescription;
        this.qcoReference = qcoReference;
        this.sourceUrl = sourceUrl;
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
