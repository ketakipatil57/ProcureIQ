package com.procureiq.controller;

import com.procureiq.dto.RecommendationRequest;
import com.procureiq.dto.RecommendationResponse;
import com.procureiq.dto.PdfRecommendationResponse;
import com.procureiq.service.FastApiClientException;
import com.procureiq.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public ResponseEntity<RecommendationResponse> recommend(@Valid @RequestBody RecommendationRequest request) {
        return ResponseEntity.ok(recommendationService.recommend(request.getQuery()));
    }

    @PostMapping(value = "/pdf", consumes = "multipart/form-data")
    public ResponseEntity<PdfRecommendationResponse> recommendPdf(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(recommendationService.recommendPdf(file));
    }

    @ExceptionHandler(FastApiClientException.class)
    public ResponseEntity<Map<String, String>> handleFastApiClientException(FastApiClientException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", exception.getMessage()));
    }
}
