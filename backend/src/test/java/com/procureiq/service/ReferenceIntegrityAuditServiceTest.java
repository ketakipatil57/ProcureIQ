package com.procureiq.service;

import com.procureiq.entity.Standard;
import com.procureiq.entity.StandardRelationship;
import com.procureiq.repository.StandardRelationshipRepository;
import com.procureiq.repository.StandardRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReferenceIntegrityAuditServiceTest {

    private final StandardRepository standardRepository = mock(StandardRepository.class);
    private final StandardRelationshipRepository relationshipRepository =
            mock(StandardRelationshipRepository.class);
    private final ReferenceIntegrityAuditService service =
            new ReferenceIntegrityAuditService(standardRepository, relationshipRepository);

    @Test
    void reportsOnlyExplicitDatabaseSupersessionEvidence() {
        Standard standard = standard("IS 123:2020", 2020, "Current edition", "IS 123:2000");
        givenStandards(standard);

        var response = service.audit("The product shall comply with IS 123:2000.");

        assertThat(response.totalReferencesChecked()).isEqualTo(1);
        assertThat(response.matchedReferenceCount()).isEqualTo(1);
        assertThat(response.findings()).singleElement().satisfies(finding -> {
            assertThat(finding.issueType()).isEqualTo("RECORDED_SUPERSESSION");
            assertThat(finding.databaseEvidence().supersedingIs()).isEqualTo("IS 123:2000");
            assertThat(finding.supportingEvidence()).anyMatch(value -> value.contains("IS 123:2000"));
            assertThat(finding.explanation()).contains("edition_year is 2020");
        });
        assertThat(response.itemsNeedingReviewCount()).isEqualTo(1);
    }

    @Test
    void reportsExplicitSupersedesRelationshipFromRelationshipTable() {
        Standard standard = standard("IS 124:2000", 2000, "Current edition", "NONE_IDENTIFIED");
        givenStandards(standard);
        when(relationshipRepository.findByTargetIsNumberIn(List.of("IS 124:2000")))
                .thenReturn(List.of(new StandardRelationship(1L, "IS 124:2020", "IS 124:2000",
                        "SUPERSEDES", "Explicit supersession mapping", "https://example.test/source")));

        var response = service.audit("Use IS 124:2000.");

        assertThat(response.findings()).singleElement().satisfies(finding -> {
            assertThat(finding.issueType()).isEqualTo("RECORDED_SUPERSESSION");
            assertThat(finding.supportingEvidence())
                    .anyMatch(value -> value.contains("IS 124:2020 SUPERSEDES IS 124:2000"));
        });
    }

    @Test
    void reportsEditionYearMismatchOnlyWhenDatabaseEditionIsAvailable() {
        givenStandards(standard("IS 456:2000", 2000, "Current edition", "NONE_IDENTIFIED"));

        var response = service.audit("Tender references IS 456:2015.");

        assertThat(response.findings()).singleElement().satisfies(finding -> {
            assertThat(finding.issueType()).isEqualTo("EDITION_YEAR_NEEDS_REVIEW");
            assertThat(finding.tenderReference()).isEqualTo("IS 456:2015");
            assertThat(finding.databaseEvidence().editionYear()).isEqualTo(2000);
            assertThat(finding.explanation()).contains("found by standard number, but the stored edition differs");
        });
        assertThat(response.matchedReferenceCount()).isEqualTo(1);
        assertThat(response.itemsNeedingReviewCount()).isEqualTo(1);
    }

    @Test
    void reportsUnknownReferenceWithRequiredManualVerificationMessage() {
        givenStandards(standard("IS 456:2000", 2000, "Current edition", "NONE_IDENTIFIED"));

        var response = service.audit("Refer to IS 99999:2024.");

        assertThat(response.totalReferencesChecked()).isEqualTo(1);
        assertThat(response.findings()).singleElement().satisfies(finding -> {
            assertThat(finding.issueType()).isEqualTo("NOT_FOUND_IN_CURATED_DATASET");
            assertThat(finding.databaseEvidence()).isNull();
            assertThat(finding.explanation()).contains("It may still be a valid standard");
        });
        assertThat(response.unknownReferenceCount()).isEqualTo(1);
    }

    @Test
    void reportsInconclusiveWhenComparisonMetadataIsMissing() {
        givenStandards(standard("IS 789:2000", null, null, null));

        var response = service.audit("Tender references IS 789:2015.");

        assertThat(response.findings())
                .extracting("issueType")
                .containsOnly("INSUFFICIENT_DATA");
        assertThat(response.findings().get(0).explanation()).contains("no edition year to compare");
        assertThat(response.inconclusiveCheckCount()).isEqualTo(1);
    }

    @Test
    void returnsNoFindingsWhenAvailableRecordsSupportNoIntegrityIssue() {
        givenStandards(standard("IS 269:2015", 2015, "Current edition", "NONE_IDENTIFIED"));

        var response = service.audit("Cement meeting IS 269:2015 is required.");

        assertThat(response.totalReferencesChecked()).isEqualTo(1);
        assertThat(response.findings()).isEmpty();
        assertThat(response.matchedReferenceCount()).isEqualTo(1);
        assertThat(response.itemsNeedingReviewCount()).isZero();
        assertThat(response.matchedReferences().get(0).explanation())
                .contains("No reference-integrity issue was identified");
    }

    @Test
    void extractsDistinctExplicitReferencesIncludingPartNumbers() {
        givenStandards(
                standard("IS 1489 (Part 1):2015", 2015, "Current edition", "NONE_IDENTIFIED"),
                standard("IS 269:2015", 2015, "Current edition", "NONE_IDENTIFIED"));

        var response = service.audit("Use IS 1489 (Part 1):2015 and IS 269:2015; repeat IS 269:2015.");

        assertThat(response.totalReferencesChecked()).isEqualTo(2);
        assertThat(response.findings()).isEmpty();
    }

    @Test
    void normalizesFormattingVariantsAndDeduplicatesByStandardNumber() {
        givenStandards(standard("IS 8520:2023", 2023, "Current edition", "NONE_IDENTIFIED"));

        var response = service.audit("IS8520:2023, IS 8520 : 2023; IS 08520.");

        assertThat(response.totalReferencesChecked()).isEqualTo(1);
        assertThat(response.matchedReferenceCount()).isEqualTo(1);
        assertThat(response.findings()).isEmpty();
        assertThat(response.matchedReferences().get(0).tenderReference()).contains("2023");
    }

    @Test
    void deduplicatesRepeatedYearVariantsAndReportsTheRecordedOlderEdition() {
        givenStandards(standard("IS 4985:2021", 2021, "Current edition", "IS 4985:2000"));

        var response = service.audit("IS 4985:2000; IS 4985 : 2000; IS 4985:2021.");

        assertThat(response.totalReferencesChecked()).isEqualTo(1);
        assertThat(response.matchedReferenceCount()).isEqualTo(1);
        assertThat(response.itemsNeedingReviewCount()).isEqualTo(1);
        assertThat(response.findings()).singleElement()
                .satisfies(finding -> assertThat(finding.issueType()).isEqualTo("RECORDED_SUPERSESSION"));
    }

    @Test
    void countsUniqueUnknownNumbersOnceDespiteRepeatedFormatting() {
        var response = service.audit("IS 99999:2024 and IS99999 : 2024");

        assertThat(response.totalReferencesChecked()).isEqualTo(1);
        assertThat(response.unknownReferenceCount()).isEqualTo(1);
    }

    private void givenStandards(Standard... standards) {
        when(standardRepository.findAll()).thenReturn(List.of(standards));
        when(relationshipRepository.findBySourceIsNumberIn(org.mockito.ArgumentMatchers.anyList()))
                .thenReturn(List.of());
        when(relationshipRepository.findByTargetIsNumberIn(org.mockito.ArgumentMatchers.anyList()))
                .thenReturn(List.of());
    }

    private Standard standard(String isNumber, Integer editionYear, String status, String supersedingIs) {
        return new Standard(isNumber, "Test standard", "Test category", null, null, null,
                editionYear, status, supersedingIs, null, null, null, null, null, null,
                "BIS_SOURCE_BACKED", null, "https://example.test/standard");
    }
}
