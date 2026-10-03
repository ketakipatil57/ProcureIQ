package com.procureiq.repository;

import com.procureiq.entity.Standard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StandardRepository extends JpaRepository<Standard, String> {

    List<Standard> findByCategory(String category);

    List<Standard> findByStatus(String status);

    List<Standard> findByCertificationStatus(String certificationStatus);

    List<Standard> findByIsNumberIn(List<String> isNumbers);
}
