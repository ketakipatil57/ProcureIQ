package com.procureiq.controller;

import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.dto.RequirementAnalysisResponse;
import com.procureiq.service.RequirementAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requirements")
public class RequirementAnalysisController {

    private final RequirementAnalysisService requirementAnalysisService;

    public RequirementAnalysisController(RequirementAnalysisService requirementAnalysisService) {
        this.requirementAnalysisService = requirementAnalysisService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<RequirementAnalysisResponse> analyze(
            @Valid @RequestBody RequirementAnalysisRequest request) {
        return ResponseEntity.ok(requirementAnalysisService.analyze(request));
    }
}
