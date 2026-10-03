package com.procureiq.repository;

import com.procureiq.entity.StandardRelationship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StandardRelationshipRepository extends JpaRepository<StandardRelationship, Long> {

    List<StandardRelationship> findBySourceIsNumber(String sourceIsNumber);

    List<StandardRelationship> findBySourceIsNumberIn(List<String> sourceIsNumbers);
}
