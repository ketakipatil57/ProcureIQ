package com.procureiq.dto;

import java.util.List;

public record ReferenceIntegrityAuditResponse(
        int totalReferencesChecked,
        int matchedReferenceCount,
        int itemsNeedingReviewCount,
        int unknownReferenceCount,
        int inconclusiveCheckCount,
        List<ReferenceMatch> matchedReferences,
        List<AuditFinding> findings) {

    public record ReferenceMatch(
            String tenderReference,
            DatabaseEvidence databaseEvidence,
            boolean issueIdentified,
            String explanation) {
    }

    public record AuditFinding(
            String tenderReference,
            String issueType,
            String severity,
            DatabaseEvidence databaseEvidence,
            List<String> supportingEvidence,
            String explanation,
            String suggestedAction) {
    }

    public record DatabaseEvidence(
            String isNumber,
            String title,
            Integer editionYear,
            String status,
            String supersedingIs,
            String verificationStatus,
            String sourceUrl) {
    }
}
