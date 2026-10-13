package com.procureiq.controller;

import com.procureiq.dto.ExplainableRecommendationResponse;
import com.procureiq.dto.RequirementAnalysisRequest;
import com.procureiq.service.FastApiClientException;
import com.procureiq.service.ExplainableRecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/requirements")
public class ExplainableRecommendationController {

    private final ExplainableRecommendationService explainableRecommendationService;

    public ExplainableRecommendationController(ExplainableRecommendationService explainableRecommendationService) {
        this.explainableRecommendationService = explainableRecommendationService;
    }

    @PostMapping("/recommendations")
    public ResponseEntity<ExplainableRecommendationResponse> recommend(
            @Valid @RequestBody RequirementAnalysisRequest request) {
        return ResponseEntity.ok(explainableRecommendationService.recommend(request));
    }

    @ExceptionHandler(FastApiClientException.class)
    public ResponseEntity<Map<String, String>> handleFastApiClientException(FastApiClientException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", exception.getMessage()));
    }
}
