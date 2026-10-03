package com.procureiq.service;

import com.procureiq.dto.FastApiStandardResult;
import com.procureiq.dto.RecommendationResponse;
import com.procureiq.dto.RecommendationResult;
import com.procureiq.dto.PdfRecommendationResponse;
import com.procureiq.entity.CertificationRequirement;
import com.procureiq.entity.Standard;
import com.procureiq.entity.StandardRelationship;
import com.procureiq.repository.CertificationRequirementRepository;
import com.procureiq.repository.StandardRelationshipRepository;
import com.procureiq.repository.StandardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;

@Service
public class RecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);
    private static final int MAX_RESULTS = 5;
    private static final long MAX_PDF_SIZE_BYTES = 10L * 1024 * 1024;

    private final FastApiClient fastApiClient;
    private final StandardRepository standardRepository;
    private final CertificationRequirementRepository certificationRequirementRepository;
    private final StandardRelationshipRepository standardRelationshipRepository;

    public RecommendationService(FastApiClient fastApiClient,
                                 StandardRepository standardRepository,
                                 CertificationRequirementRepository certificationRequirementRepository,
                                 StandardRelationshipRepository standardRelationshipRepository) {
        this.fastApiClient = fastApiClient;
        this.standardRepository = standardRepository;
        this.certificationRequirementRepository = certificationRequirementRepository;
        this.standardRelationshipRepository = standardRelationshipRepository;
    }

    public RecommendationResponse recommend(String query) {
        List<FastApiStandardResult> rankedResults = fastApiClient.match(query).stream()
                .limit(MAX_RESULTS)
                .toList();

        return new RecommendationResponse(query, enrich(rankedResults));
    }

    public PdfRecommendationResponse recommendPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A PDF file is required");
        }
        if (file.getSize() > MAX_PDF_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF file must not exceed 10 MB");
        }

        byte[] pdfBytes;
        try {
            pdfBytes = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded PDF", exception);
        }
        if (!hasPdfSignature(pdfBytes)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is not a valid PDF");
        }

        List<FastApiStandardResult> rankedResults = fastApiClient.matchPdf(file.getOriginalFilename(), pdfBytes)
                .stream()
                .limit(MAX_RESULTS)
                .toList();
        return new PdfRecommendationResponse(file.getOriginalFilename(), enrich(rankedResults));
    }

    private boolean hasPdfSignature(byte[] content) {
        byte[] signature = "%PDF-".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        int maxStart = Math.min(content.length - signature.length, 1024);
        for (int start = 0; start <= maxStart; start++) {
            boolean matches = true;
            for (int index = 0; index < signature.length; index++) {
                if (content[start + index] != signature[index]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return true;
            }
        }
        return false;
    }

    private List<RecommendationResult> enrich(List<FastApiStandardResult> rankedResults) {

        List<String> isNumbers = new ArrayList<>(rankedResults.stream()
                .map(FastApiStandardResult::getIsNumber)
                .collect(Collectors.toCollection(LinkedHashSet::new)));

        if (isNumbers.isEmpty()) {
            return List.of();
        }

        Map<String, Standard> standardsByIsNumber = standardRepository.findByIsNumberIn(isNumbers).stream()
                .collect(Collectors.toMap(Standard::getIsNumber, Function.identity()));

        List<String> existingIsNumbers = isNumbers.stream()
                .filter(standardsByIsNumber::containsKey)
                .toList();

        Map<String, List<CertificationRequirement>> requirementsByIsNumber = existingIsNumbers.isEmpty()
                ? Map.of()
                : certificationRequirementRepository.findByIsNumberIn(existingIsNumbers).stream()
                        .collect(groupingBy(CertificationRequirement::getIsNumber));

        Map<String, List<StandardRelationship>> relationshipsBySource = existingIsNumbers.isEmpty()
                ? Map.of()
                : standardRelationshipRepository.findBySourceIsNumberIn(existingIsNumbers).stream()
                        .collect(groupingBy(StandardRelationship::getSourceIsNumber));

        List<RecommendationResult> enrichedResults = new ArrayList<>();
        for (FastApiStandardResult rankedResult : rankedResults) {
            Standard standard = standardsByIsNumber.get(rankedResult.getIsNumber());
            if (standard == null) {
                logger.warn("FastAPI recommended IS number absent from MySQL standards table: {}",
                        rankedResult.getIsNumber());
                continue;
            }
            enrichedResults.add(toRecommendationResult(
                    rankedResult,
                    standard,
                    requirementsByIsNumber.getOrDefault(standard.getIsNumber(), List.of()),
                    relationshipsBySource.getOrDefault(standard.getIsNumber(), List.of())
            ));
        }

        return enrichedResults;
    }

    private RecommendationResult toRecommendationResult(FastApiStandardResult rankedResult,
                                                        Standard standard,
                                                        List<CertificationRequirement> requirements,
                                                        List<StandardRelationship> relationships) {
        RecommendationResult result = new RecommendationResult();
        result.setIsNumber(standard.getIsNumber());
        result.setTitle(standard.getTitle());
        result.setScore(rankedResult.getScore());
        result.setCategory(standard.getCategory());
        result.setScopeSummary(standard.getScopeSummary());
        result.setEditionYear(standard.getEditionYear());
        result.setStatus(standard.getStatus());
        result.setSupersedingIs(standard.getSupersedingIs());
        result.setAmendmentCount(standard.getAmendmentCount());
        result.setLatestAmendmentNote(standard.getLatestAmendmentNote());
        result.setCertificationStatus(standard.getCertificationStatus());
        result.setCertificationType(standard.getCertificationType());
        result.setQcoReference(standard.getQcoReference());
        result.setVerificationStatus(standard.getVerificationStatus());
        result.setSourceUrl(standard.getSourceUrl());
        result.setCertificationRequirements(requirements.stream().map(this::toRequirementInfo).toList());
        result.setRelationships(relationships.stream().map(this::toRelationshipInfo).toList());
        return result;
    }

    private RecommendationResult.CertificationRequirementInfo toRequirementInfo(CertificationRequirement requirement) {
        RecommendationResult.CertificationRequirementInfo info =
                new RecommendationResult.CertificationRequirementInfo();
        info.setCertificationId(requirement.getCertificationId());
        info.setIsNumber(requirement.getIsNumber());
        info.setCertificationType(requirement.getCertificationType());
        info.setRequirementStatus(requirement.getRequirementStatus());
        info.setRequirementDescription(requirement.getRequirementDescription());
        info.setQcoReference(requirement.getQcoReference());
        info.setSourceUrl(requirement.getSourceUrl());
        return info;
    }

    private RecommendationResult.RelationshipInfo toRelationshipInfo(StandardRelationship relationship) {
        RecommendationResult.RelationshipInfo info = new RecommendationResult.RelationshipInfo();
        info.setRelationshipId(relationship.getRelationshipId());
        info.setSourceIsNumber(relationship.getSourceIsNumber());
        info.setTargetIsNumber(relationship.getTargetIsNumber());
        info.setRelationshipType(relationship.getRelationshipType());
        info.setDescription(relationship.getDescription());
        info.setSourceUrl(relationship.getSourceUrl());
        return info;
    }
}
