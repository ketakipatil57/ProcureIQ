package com.procureiq.controller;

import com.procureiq.dto.ReferenceIntegrityAuditRequest;
import com.procureiq.dto.ReferenceIntegrityAuditResponse;
import com.procureiq.service.ReferenceIntegrityAuditService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reference-integrity")
public class ReferenceIntegrityAuditController {

    private final ReferenceIntegrityAuditService auditService;

    public ReferenceIntegrityAuditController(ReferenceIntegrityAuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping("/audit")
    public ResponseEntity<ReferenceIntegrityAuditResponse> audit(
            @Valid @RequestBody ReferenceIntegrityAuditRequest request) {
        return ResponseEntity.ok(auditService.audit(request.tenderText()));
    }
}
