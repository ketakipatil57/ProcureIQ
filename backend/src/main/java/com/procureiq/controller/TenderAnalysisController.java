package com.procureiq.controller;

import com.procureiq.dto.TenderAnalysisResponse;
import com.procureiq.service.TenderAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/requirements")
public class TenderAnalysisController {

    private final TenderAnalysisService tenderAnalysisService;

    public TenderAnalysisController(TenderAnalysisService tenderAnalysisService) {
        this.tenderAnalysisService = tenderAnalysisService;
    }

    @PostMapping(value = "/tender-analysis", consumes = "multipart/form-data")
    public ResponseEntity<TenderAnalysisResponse> analyzeTender(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(tenderAnalysisService.analyze(file));
    }
}
