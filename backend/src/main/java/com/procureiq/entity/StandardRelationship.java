package com.procureiq.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "standard_relationships")
public class StandardRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "relationship_id", nullable = false)
    private Long relationshipId;

    @Column(name = "source_is_number", nullable = false, length = 50)
    private String sourceIsNumber;

    @Column(name = "target_is_number", nullable = false, length = 100)
    private String targetIsNumber;

    @Column(name = "relationship_type", nullable = false, length = 50)
    private String relationshipType;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    public StandardRelationship() {
    }

    public StandardRelationship(Long relationshipId, String sourceIsNumber, String targetIsNumber,
                                String relationshipType, String description, String sourceUrl) {
        this.relationshipId = relationshipId;
        this.sourceIsNumber = sourceIsNumber;
        this.targetIsNumber = targetIsNumber;
        this.relationshipType = relationshipType;
        this.description = description;
        this.sourceUrl = sourceUrl;
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
