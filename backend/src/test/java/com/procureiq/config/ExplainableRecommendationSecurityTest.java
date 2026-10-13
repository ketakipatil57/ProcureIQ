package com.procureiq.config;

import com.procureiq.dto.ExplainableRecommendationResponse;
import com.procureiq.dto.TenderAnalysisResponse;
import com.procureiq.entity.User;
import com.procureiq.repository.UserRepository;
import com.procureiq.security.JwtAuthenticationFilter;
import com.procureiq.security.JwtService;
import com.procureiq.service.ExplainableRecommendationService;
import com.procureiq.service.TenderAnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {
                com.procureiq.controller.ExplainableRecommendationController.class,
                com.procureiq.controller.TenderAnalysisController.class,
                com.procureiq.controller.ReferenceIntegrityAuditController.class
        },
        properties = {
                "jwt.secret=procureiq-test-secret-with-at-least-32-bytes",
                "jwt.expiration-ms=3600000"
        })
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ExplainableRecommendationSecurityTest {

    private static final String EMAIL = "officer@example.com";
    private static final String VALID_TOKEN = "valid-test-token";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExplainableRecommendationService explainableRecommendationService;

    @MockBean
    private TenderAnalysisService tenderAnalysisService;

    @MockBean
    private com.procureiq.service.ReferenceIntegrityAuditService referenceIntegrityAuditService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void allowsAuthenticatedUserToCallRefinedRecommendations() throws Exception {
        User user = new User("Officer", EMAIL, "encoded-password", "PROCUREMENT_OFFICER");
        when(jwtService.extractUsername(VALID_TOKEN)).thenReturn(EMAIL);
        when(jwtService.isTokenValid(VALID_TOKEN, user)).thenReturn(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(explainableRecommendationService.recommend(any()))
                .thenReturn(new ExplainableRecommendationResponse());

        mockMvc.perform(post("/api/requirements/recommendations")
                        .header("Authorization", "Bearer " + VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction"}
                                """))
                .andExpect(status().isOk());

        verify(explainableRecommendationService).recommend(any());
    }

    @Test
    void rejectsUnauthenticatedRequestToRefinedRecommendations() throws Exception {
        mockMvc.perform(post("/api/requirements/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requirement":"Cement for construction"}
                                """))
                .andExpect(status().isForbidden());

        verify(explainableRecommendationService, never()).recommend(any());
    }

    @Test
    void allowsAuthenticatedUserToAnalyzeTender() throws Exception {
        User user = new User("Officer", EMAIL, "encoded-password", "PROCUREMENT_OFFICER");
        when(jwtService.extractUsername(VALID_TOKEN)).thenReturn(EMAIL);
        when(jwtService.isTokenValid(VALID_TOKEN, user)).thenReturn(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(tenderAnalysisService.analyze(any()))
                .thenReturn(new TenderAnalysisResponse("tender.pdf",
                        TenderAnalysisResponse.ExtractionStatus.EMPTY, "", null, "No text"));
        MockMultipartFile file = new MockMultipartFile(
                "file", "tender.pdf", MediaType.APPLICATION_PDF_VALUE, "%PDF-1.7".getBytes());

        mockMvc.perform(multipart("/api/requirements/tender-analysis")
                        .file(file)
                        .header("Authorization", "Bearer " + VALID_TOKEN))
                .andExpect(status().isOk());

        verify(tenderAnalysisService).analyze(any());
    }

    @Test
    void rejectsUnauthenticatedTenderAnalysisRequest() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "tender.pdf", MediaType.APPLICATION_PDF_VALUE, "%PDF-1.7".getBytes());

        mockMvc.perform(multipart("/api/requirements/tender-analysis").file(file))
                .andExpect(status().isForbidden());

        verify(tenderAnalysisService, never()).analyze(any());
    }

    @Test
    void allowsAuthenticatedUserToRunReferenceIntegrityAudit() throws Exception {
        User user = new User("Officer", EMAIL, "encoded-password", "PROCUREMENT_OFFICER");
        when(jwtService.extractUsername(VALID_TOKEN)).thenReturn(EMAIL);
        when(jwtService.isTokenValid(VALID_TOKEN, user)).thenReturn(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(referenceIntegrityAuditService.audit("Tender cites IS 456:2000"))
                .thenReturn(new com.procureiq.dto.ReferenceIntegrityAuditResponse(
                        1, 1, 0, 0, 0, java.util.List.of(), java.util.List.of()));

        mockMvc.perform(post("/api/reference-integrity/audit")
                        .header("Authorization", "Bearer " + VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tenderText":"Tender cites IS 456:2000"}
                                """))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.totalReferencesChecked").value(1))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.findings").isArray());

        verify(referenceIntegrityAuditService).audit("Tender cites IS 456:2000");
    }

    @Test
    void rejectsUnauthenticatedReferenceIntegrityAudit() throws Exception {
        mockMvc.perform(post("/api/reference-integrity/audit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tenderText":"Tender cites IS 456:2000"}
                                """))
                .andExpect(status().isForbidden());

        verify(referenceIntegrityAuditService, never()).audit(any());
    }
}
