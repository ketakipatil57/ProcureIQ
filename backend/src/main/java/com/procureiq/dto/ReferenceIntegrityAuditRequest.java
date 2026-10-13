package com.procureiq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReferenceIntegrityAuditRequest(
        @NotBlank @Size(max = 100_000) String tenderText) {
}
