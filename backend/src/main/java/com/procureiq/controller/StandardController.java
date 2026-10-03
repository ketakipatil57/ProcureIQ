package com.procureiq.controller;

import com.procureiq.dto.StandardResponse;
import com.procureiq.service.StandardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/standards")
public class StandardController {

    private final StandardService standardService;

    public StandardController(StandardService standardService) {
        this.standardService = standardService;
    }

    @GetMapping
    public ResponseEntity<List<StandardResponse>> getAllStandards() {
        return ResponseEntity.ok(standardService.getAllStandards());
    }

    @GetMapping("/{isNumber}")
    public ResponseEntity<StandardResponse> getStandardByIsNumber(@PathVariable String isNumber) {
        return standardService.getStandardByIsNumber(isNumber)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<StandardResponse>> getStandardsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(standardService.getStandardsByCategory(category));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<StandardResponse>> getStandardsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(standardService.getStandardsByStatus(status));
    }

    @GetMapping({"/certification-status/{certificationStatus}", "/certification/{certificationStatus}"})
    public ResponseEntity<List<StandardResponse>> getStandardsByCertificationStatus(
            @PathVariable String certificationStatus) {
        return ResponseEntity.ok(standardService.getStandardsByCertificationStatus(certificationStatus));
    }
}
