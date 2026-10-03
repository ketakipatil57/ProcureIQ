package com.procureiq.repository;

import com.procureiq.entity.CertificationRequirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificationRequirementRepository extends JpaRepository<CertificationRequirement, Long> {

    List<CertificationRequirement> findByIsNumber(String isNumber);

    List<CertificationRequirement> findByIsNumberIn(List<String> isNumbers);
}
