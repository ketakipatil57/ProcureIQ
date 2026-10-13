package com.procureiq.service;

import com.procureiq.dto.ReferenceIntegrityAuditResponse;
import com.procureiq.dto.ReferenceIntegrityAuditResponse.AuditFinding;
import com.procureiq.dto.ReferenceIntegrityAuditResponse.DatabaseEvidence;
import com.procureiq.dto.ReferenceIntegrityAuditResponse.ReferenceMatch;
import com.procureiq.entity.Standard;
import com.procureiq.entity.StandardRelationship;
import com.procureiq.repository.StandardRelationshipRepository;
import com.procureiq.repository.StandardRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReferenceIntegrityAuditService {

    private static final Pattern IS_REFERENCE = Pattern.compile(
            "\\bIS\\s*(?:NO\\.?\\s*)?(\\d{1,5})"
                    + "(?:\\s*\\(\\s*PART\\s+(\\d+[A-Z]?)\\s*\\))?"
                    + "(?:(?:\\s*[:/\\-]\\s*|\\s+)(\\d{4}))?\\b",
            Pattern.CASE_INSENSITIVE);
    private static final String NOT_FOUND_MESSAGE =
            "The reference was not found in ProcureIQ’s current curated dataset. It may still be a valid standard; "
                    + "verify it using an authoritative BIS source before making a procurement decision.";
    private static final String CLEAN_MATCH_MESSAGE =
            "The reference matched a record in the curated dataset. No reference-integrity issue was identified "
                    + "from the available metadata. This does not independently establish current BIS status "
                    + "or product compliance.";

    private final StandardRepository standardRepository;
    private final StandardRelationshipRepository relationshipRepository;

    public ReferenceIntegrityAuditService(StandardRepository standardRepository,
                                          StandardRelationshipRepository relationshipRepository) {
        this.standardRepository = standardRepository;
        this.relationshipRepository = relationshipRepository;
    }

    public ReferenceIntegrityAuditResponse audit(String tenderText) {
        Map<String, ReferenceBuilder> references = extractReferences(tenderText);
        if (references.isEmpty()) {
            return new ReferenceIntegrityAuditResponse(0, 0, 0, 0, 0, List.of(), List.of());
        }

        Map<String, List<Standard>> standardsByIdentifier = standardsByIdentifier(standardRepository.findAll());
        List<Standard> matchedStandards = references.entrySet().stream()
                .flatMap(entry -> standardsByIdentifier.getOrDefault(entry.getKey(), List.of()).stream())
                .distinct()
                .toList();
        List<String> matchedIdentifiers = matchedStandards.stream().map(Standard::getIsNumber).toList();
        List<StandardRelationship> sourceRelationships = matchedIdentifiers.isEmpty()
                ? List.of()
                : relationshipRepository.findBySourceIsNumberIn(matchedIdentifiers);
        List<StandardRelationship> targetRelationships = matchedIdentifiers.isEmpty()
                ? List.of()
                : relationshipRepository.findByTargetIsNumberIn(matchedIdentifiers);

        List<ReferenceMatch> matches = new ArrayList<>();
        List<AuditFinding> findings = new ArrayList<>();
        int unknownCount = 0;
        int reviewCount = 0;
        int inconclusiveCount = 0;

        for (Map.Entry<String, ReferenceBuilder> entry : references.entrySet()) {
            ReferenceBuilder reference = entry.getValue();
            List<Standard> records = standardsByIdentifier.getOrDefault(entry.getKey(), List.of());
            if (records.isEmpty()) {
                unknownCount++;
                findings.add(finding(reference.display(), "NOT_FOUND_IN_CURATED_DATASET", "INFORMATIONAL",
                        null, List.of("Tender states: " + reference.display()),
                        NOT_FOUND_MESSAGE,
                        "Verify the reference against an authoritative BIS source before making a procurement decision."));
                continue;
            }

            Standard standard = selectRecord(records, reference.years);
            if (standard == null) {
                matches.add(new ReferenceMatch(reference.display(), null, true, ""));
                inconclusiveCount++;
                findings.add(finding(reference.display(), "INSUFFICIENT_DATA", "INCONCLUSIVE", null,
                        List.of("The standard number matched " + records.size()
                                + " database editions, but the record needed to compare the tender edition "
                                + "could not be selected reliably."),
                        "A record exists for this IS number, but the available data does not identify one "
                                + "edition that can be compared reliably with the tender.",
                        "Confirm the intended edition against an authoritative BIS source and the tender authority."));
                continue;
            }

            DatabaseEvidence databaseEvidence = evidence(standard);
            boolean hasIssue = false;
            List<AuditFinding> referenceFindings = new ArrayList<>();
            addSupersessionFindings(reference, standard, databaseEvidence,
                    sourceRelationships, targetRelationships, referenceFindings);
            addEditionFindings(reference, standard, databaseEvidence, referenceFindings);
            addMetadataLimitations(reference, standard, databaseEvidence, referenceFindings);
            if (!referenceFindings.isEmpty()) {
                hasIssue = true;
                if (referenceFindings.stream().anyMatch(item -> !"INSUFFICIENT_DATA".equals(item.issueType()))) {
                    reviewCount++;
                }
                inconclusiveCount += (int) referenceFindings.stream()
                        .filter(item -> "INSUFFICIENT_DATA".equals(item.issueType())).count();
            }
            matches.add(new ReferenceMatch(reference.display(), databaseEvidence, hasIssue,
                    hasIssue ? "" : CLEAN_MATCH_MESSAGE));
            findings.addAll(referenceFindings);
        }

        return new ReferenceIntegrityAuditResponse(references.size(), matches.size(), reviewCount,
                unknownCount, inconclusiveCount, List.copyOf(matches), List.copyOf(findings));
    }

    private Map<String, ReferenceBuilder> extractReferences(String tenderText) {
        Map<String, ReferenceBuilder> references = new LinkedHashMap<>();
        Matcher matcher = IS_REFERENCE.matcher(tenderText == null ? "" : tenderText);
        while (matcher.find() && references.size() < 200) {
            String number = normalizeNumber(matcher.group(1));
            String part = normalizePart(matcher.group(2));
            String year = matcher.group(3);
            String key = identity(number, part);
            ReferenceBuilder reference = references.computeIfAbsent(key,
                    ignored -> new ReferenceBuilder(number, part));
            reference.add(year);
        }
        return references;
    }

    private Map<String, List<Standard>> standardsByIdentifier(List<Standard> standards) {
        Map<String, List<Standard>> result = new LinkedHashMap<>();
        for (Standard standard : standards) {
            ParsedReference parsed = parseReference(standard.getIsNumber());
            if (parsed != null) {
                result.computeIfAbsent(identity(parsed.number(), parsed.part()), ignored -> new ArrayList<>())
                        .add(standard);
            }
        }
        return result;
    }

    private ParsedReference parseReference(String value) {
        if (value == null) return null;
        Matcher matcher = IS_REFERENCE.matcher(value);
        if (!matcher.find()) return null;
        return new ParsedReference(normalizeNumber(matcher.group(1)),
                normalizePart(matcher.group(2)), matcher.group(3));
    }

    private Standard selectRecord(List<Standard> records, Set<String> tenderYears) {
        if (tenderYears.isEmpty()) {
            return records.size() == 1 ? records.get(0) : null;
        }
        List<Standard> matchingRecords = records.stream()
                .filter(record -> tenderYears.contains(record.getEditionYear() == null
                        ? null : String.valueOf(record.getEditionYear())))
                .toList();
        if (matchingRecords.size() == 1) return matchingRecords.get(0);
        if (matchingRecords.size() > 1 || records.size() > 1) return null;
        return records.get(0);
    }

    private void addSupersessionFindings(ReferenceBuilder reference,
                                         Standard standard,
                                         DatabaseEvidence databaseEvidence,
                                         List<StandardRelationship> sourceRelationships,
                                         List<StandardRelationship> targetRelationships,
                                         List<AuditFinding> findings) {
        List<String> evidence = new ArrayList<>();
        String supersedingIs = standard.getSupersedingIs();
        if (isMeaningful(supersedingIs)) {
            evidence.add("Database " + standard.getIsNumber() + " superseding_is field: " + supersedingIs);
        }
        if (isSupersededStatus(standard.getStatus())) {
            evidence.add("Database status field for " + standard.getIsNumber() + ": " + standard.getStatus());
        }
        sourceRelationships.stream()
                .filter(relationship -> sameIdentifier(relationship.getSourceIsNumber(), standard.getIsNumber()))
                .filter(relationship -> relationship.getRelationshipType() != null
                        && relationship.getRelationshipType().toUpperCase(Locale.ROOT).contains("SUPERSEDED_BY"))
                .forEach(relationship -> evidence.add("Database relationship: "
                        + relationship.getRelationshipType() + " — " + relationship.getTargetIsNumber()
                        + descriptionSuffix(relationship)));
        targetRelationships.stream()
                .filter(relationship -> sameIdentifier(relationship.getTargetIsNumber(), standard.getIsNumber()))
                .filter(relationship -> relationship.getRelationshipType() != null
                        && relationship.getRelationshipType().toUpperCase(Locale.ROOT).contains("SUPERSEDES"))
                .forEach(relationship -> evidence.add("Database relationship: "
                        + relationship.getSourceIsNumber() + " " + relationship.getRelationshipType()
                        + " " + relationship.getTargetIsNumber() + descriptionSuffix(relationship)));

        boolean tenderCitesRecordedPredecessor = reference.years.stream()
                .anyMatch(year -> includesReference(supersedingIs, reference.number, reference.part, year));
        if (!evidence.isEmpty() && (isSupersededStatus(standard.getStatus()) || tenderCitesRecordedPredecessor
                || hasExplicitReplacementRelationship(standard, sourceRelationships, targetRelationships))) {
            String cited = reference.display();
            String editionEvidence = standard.getEditionYear() == null ? ""
                    : " The database edition_year is " + standard.getEditionYear() + ".";
            String explanation = "The tender states " + cited + ". The database record for "
                    + standard.getIsNumber() + editionEvidence + " explicitly records supersession evidence: "
                    + String.join("; ", evidence) + ". Confirm the relationship and applicability.";
            findings.add(finding(cited, "RECORDED_SUPERSESSION", "REVIEW", databaseEvidence, evidence,
                    explanation,
                    "Verify this recorded relationship with an authoritative BIS source and the tender authority; "
                            + "do not substitute a standard automatically."));
        }
    }

    private boolean hasExplicitReplacementRelationship(Standard standard,
                                                        List<StandardRelationship> sourceRelationships,
                                                        List<StandardRelationship> targetRelationships) {
        return sourceRelationships.stream()
                .anyMatch(relationship -> sameIdentifier(relationship.getSourceIsNumber(), standard.getIsNumber())
                        && relationship.getRelationshipType() != null
                        && relationship.getRelationshipType().toUpperCase(Locale.ROOT).contains("SUPERSEDED_BY"))
                || targetRelationships.stream()
                .anyMatch(relationship -> sameIdentifier(relationship.getTargetIsNumber(), standard.getIsNumber())
                        && relationship.getRelationshipType() != null
                        && relationship.getRelationshipType().toUpperCase(Locale.ROOT).contains("SUPERSEDES"));
    }

    private void addEditionFindings(ReferenceBuilder reference,
                                    Standard standard,
                                    DatabaseEvidence databaseEvidence,
                                    List<AuditFinding> findings) {
        for (String year : reference.years) {
            if (includesReference(standard.getSupersedingIs(),
                    reference.number, reference.part, year)) {
                continue;
            }
            if (standard.getEditionYear() == null) {
                String cited = reference.display(year);
                findings.add(finding(cited, "INSUFFICIENT_DATA", "INCONCLUSIVE", databaseEvidence,
                        List.of("Tender states: " + cited,
                                "Database record has no edition_year value for " + standard.getIsNumber() + "."),
                        cited + " matched the standard number, but the database has no edition year to compare.",
                        "Check the intended edition with an authoritative BIS source and the tender authority."));
            } else if (!year.equals(String.valueOf(standard.getEditionYear()))) {
                String cited = reference.display(year);
                findings.add(finding(cited, "EDITION_YEAR_NEEDS_REVIEW", "REVIEW", databaseEvidence,
                        List.of("Tender states edition/year: " + cited,
                                "Database records edition_year " + standard.getEditionYear()
                                        + " for " + standard.getIsNumber() + "."),
                        cited + " was found by standard number, but the stored edition differs. "
                                + "Confirm which edition the tender intends to require before finalizing the specification.",
                        "Confirm the intended edition with the tender authority and an authoritative BIS source; "
                                + "a newer database edition is not automatically applicable."));
            }
        }
    }

    private void addMetadataLimitations(ReferenceBuilder reference,
                                        Standard standard,
                                        DatabaseEvidence databaseEvidence,
                                        List<AuditFinding> findings) {
        if (findings.stream().anyMatch(item -> "INSUFFICIENT_DATA".equals(item.issueType()))) return;
        if (isMeaningful(standard.getSupersedingIs()) || isSupersededStatus(standard.getStatus())) return;
        if (isExplicitNoSupersession(standard.getSupersedingIs())) return;
        findings.add(finding(reference.display(), "INSUFFICIENT_DATA", "INCONCLUSIVE", databaseEvidence,
                List.of("The record lacks a usable superseding_is value and status: "
                        + nullableValue(standard.getSupersedingIs()) + " / " + nullableValue(standard.getStatus()) + "."),
                "The reference matched, but the record does not provide enough supersession metadata for that check.",
                "Verify supersession status with an authoritative BIS source."));
    }

    private boolean includesReference(String databaseValue, String number, String part, String year) {
        if (!isMeaningful(databaseValue)) return false;
        Matcher matcher = IS_REFERENCE.matcher(databaseValue);
        while (matcher.find()) {
            if (normalizeNumber(matcher.group(1)).equals(number)
                    && normalizePart(matcher.group(2)).equals(part)
                    && year.equals(matcher.group(3))) {
                return true;
            }
        }
        return false;
    }

    private AuditFinding finding(String tenderReference,
                                 String issueType,
                                 String severity,
                                 DatabaseEvidence databaseEvidence,
                                 List<String> supportingEvidence,
                                 String explanation,
                                 String suggestedAction) {
        return new AuditFinding(tenderReference, issueType, severity, databaseEvidence,
                List.copyOf(supportingEvidence), explanation, suggestedAction);
    }

    private DatabaseEvidence evidence(Standard standard) {
        return new DatabaseEvidence(standard.getIsNumber(), standard.getTitle(), standard.getEditionYear(),
                standard.getStatus(), standard.getSupersedingIs(), standard.getVerificationStatus(),
                standard.getSourceUrl());
    }

    private boolean isMeaningful(String value) {
        return value != null && !value.isBlank()
                && !List.of("NONE_IDENTIFIED", "NOT_STATED_IN_SOURCE", "NOT_APPLICABLE", "UNKNOWN")
                .contains(value.trim().toUpperCase(Locale.ROOT));
    }

    private boolean isExplicitNoSupersession(String value) {
        return value != null && value.trim().equalsIgnoreCase("NONE_IDENTIFIED");
    }

    private boolean isSupersededStatus(String status) {
        if (status == null) return false;
        String normalized = status.toLowerCase(Locale.ROOT);
        return normalized.contains("superseded")
                && !normalized.contains("not superseded")
                && !normalized.contains("not_superseded")
                && !normalized.contains("no supersession");
    }

    private boolean sameIdentifier(String first, String second) {
        return first != null && second != null
                && first.replaceAll("\\s+", "").equalsIgnoreCase(second.replaceAll("\\s+", ""));
    }

    private String descriptionSuffix(StandardRelationship relationship) {
        return isMeaningful(relationship.getDescription()) ? " (" + relationship.getDescription() + ")" : "";
    }

    private String nullableValue(String value) {
        return value == null || value.isBlank() ? "not recorded" : value;
    }

    private String identity(String number, String part) {
        return number + "|" + part;
    }

    private String normalizeNumber(String number) {
        return number == null ? "" : number.replaceFirst("^0+(?!$)", "");
    }

    private String normalizePart(String part) {
        return part == null ? "" : part.toUpperCase(Locale.ROOT);
    }

    private record ParsedReference(String number, String part, String year) {
    }

    private static final class ReferenceBuilder {
        private final String number;
        private final String part;
        private final Set<String> years = new LinkedHashSet<>();
        private boolean yearNotSpecified;

        private ReferenceBuilder(String number, String part) {
            this.number = number;
            this.part = part;
        }

        private void add(String year) {
            if (year != null) years.add(year);
            else yearNotSpecified = true;
        }

        private String display() {
            List<String> citedForms = new ArrayList<>();
            if (yearNotSpecified || years.isEmpty()) citedForms.add(display(null));
            years.forEach(year -> citedForms.add(display(year)));
            return String.join(" / ", citedForms);
        }

        private String display(String year) {
            return "IS " + number + (part.isEmpty() ? "" : " (Part " + part + ")")
                    + (year == null ? "" : ":" + year);
        }
    }
}
