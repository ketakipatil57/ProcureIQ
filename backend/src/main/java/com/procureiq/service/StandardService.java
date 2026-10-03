package com.procureiq.service;

import com.procureiq.dto.StandardResponse;
import com.procureiq.entity.Standard;
import com.procureiq.repository.CertificationRequirementRepository;
import com.procureiq.repository.StandardRelationshipRepository;
import com.procureiq.repository.StandardRepository;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;
import java.util.Optional;

@Service
public class StandardService {

    private final StandardRepository standardRepository;
    private final CertificationRequirementRepository certificationRequirementRepository;
    private final StandardRelationshipRepository standardRelationshipRepository;

    public StandardService(StandardRepository standardRepository,
                           CertificationRequirementRepository certificationRequirementRepository,
                           StandardRelationshipRepository standardRelationshipRepository) {
        this.standardRepository = standardRepository;
        this.certificationRequirementRepository = certificationRequirementRepository;
        this.standardRelationshipRepository = standardRelationshipRepository;
    }

    @Cacheable(cacheNames = "standards:all")
    public List<StandardResponse> getAllStandards() {
        return standardRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Cacheable(cacheNames = "standards:byIsNumber", key = "#isNumber", unless = "#result == null")
    public Optional<StandardResponse> getStandardByIsNumber(String isNumber) {
        return standardRepository.findById(isNumber).map(standard -> {
            StandardResponse response = toResponse(standard);
            response.setCertificationRequirements(certificationRequirementRepository.findByIsNumber(isNumber));
            response.setRelationships(standardRelationshipRepository.findBySourceIsNumber(isNumber));
            return response;
        });
    }

    @Cacheable(cacheNames = "standards:byCategory", key = "#category")
    public List<StandardResponse> getStandardsByCategory(String category) {
        return standardRepository.findByCategory(category).stream().map(this::toResponse).toList();
    }

    @Cacheable(cacheNames = "standards:byStatus", key = "#status")
    public List<StandardResponse> getStandardsByStatus(String status) {
        return standardRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    @Cacheable(cacheNames = "standards:byCertificationStatus", key = "#certificationStatus")
    public List<StandardResponse> getStandardsByCertificationStatus(String certificationStatus) {
        return standardRepository.findByCertificationStatus(certificationStatus).stream().map(this::toResponse).toList();
    }

    private StandardResponse toResponse(Standard standard) {
        StandardResponse response = new StandardResponse();
        response.setIsNumber(standard.getIsNumber());
        response.setTitle(standard.getTitle());
        response.setCategory(standard.getCategory());
        response.setScopeSummary(standard.getScopeSummary());
        response.setEditionYear(standard.getEditionYear());
        response.setStatus(standard.getStatus());
        response.setSupersedingIs(standard.getSupersedingIs());
        response.setAmendmentCount(standard.getAmendmentCount());
        response.setLatestAmendmentNote(standard.getLatestAmendmentNote());
        response.setCertificationStatus(standard.getCertificationStatus());
        response.setCertificationType(standard.getCertificationType());
        response.setQcoReference(standard.getQcoReference());
        response.setRelatedStandards(standard.getRelatedStandards());
        response.setVerificationStatus(standard.getVerificationStatus());
        response.setDataQualityNote(standard.getDataQualityNote());
        response.setSourceUrl(standard.getSourceUrl());
        return response;
    }
}
