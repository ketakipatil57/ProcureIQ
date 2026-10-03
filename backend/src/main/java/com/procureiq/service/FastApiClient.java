package com.procureiq.service;

import com.procureiq.dto.FastApiMatchRequest;
import com.procureiq.dto.FastApiMatchResponse;
import com.procureiq.dto.FastApiStandardResult;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.List;

@Component
public class FastApiClient {

    private final RestClient restClient;

    public FastApiClient(RestClient fastApiRestClient) {
        this.restClient = fastApiRestClient;
    }

    public List<FastApiStandardResult> match(String text) {
        FastApiMatchResponse response;
        try {
            response = restClient.post()
                    .uri("/match")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new FastApiMatchRequest(text))
                    .retrieve()
                    .body(FastApiMatchResponse.class);
        } catch (RestClientResponseException exception) {
            throw new FastApiClientException(
                    "FastAPI /match returned HTTP " + exception.getStatusCode().value(), exception);
        } catch (ResourceAccessException exception) {
            if (hasTimeoutCause(exception)) {
                throw new FastApiClientException("FastAPI /match request timed out", exception);
            }
            throw new FastApiClientException("FastAPI is unavailable at the configured base URL", exception);
        } catch (RestClientException exception) {
            throw new FastApiClientException("FastAPI /match returned a malformed or unexpected response", exception);
        }

        return validateResponse(response, "/match");
    }

    public List<FastApiStandardResult> matchPdf(String fileName, byte[] pdfBytes) {
        FastApiMatchResponse response;
        String multipartFileName = sanitizeFileName(fileName);
        ByteArrayResource pdfResource = new ByteArrayResource(pdfBytes) {
            @Override
            public String getFilename() {
                return multipartFileName;
            }
        };
        MultipartBodyBuilder multipartBody = new MultipartBodyBuilder();
        multipartBody.part("file", pdfResource)
                .filename(multipartFileName)
                .contentType(MediaType.APPLICATION_PDF);

        try {
            response = restClient.post()
                    .uri("/match-pdf")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(multipartBody.build())
                    .retrieve()
                    .body(FastApiMatchResponse.class);
        } catch (RestClientResponseException exception) {
            throw new FastApiClientException(
                    "FastAPI /match-pdf returned HTTP " + exception.getStatusCode().value(), exception);
        } catch (ResourceAccessException exception) {
            if (hasTimeoutCause(exception)) {
                throw new FastApiClientException("FastAPI /match-pdf request timed out", exception);
            }
            throw new FastApiClientException("FastAPI is unavailable at the configured base URL", exception);
        } catch (RestClientException exception) {
            throw new FastApiClientException(
                    "FastAPI /match-pdf returned a malformed or unexpected response", exception);
        }

        return validateResponse(response, "/match-pdf");
    }

    private List<FastApiStandardResult> validateResponse(FastApiMatchResponse response, String endpoint) {
        if (response == null || response.getResults() == null
                || response.getResults().stream().anyMatch(this::isMalformedResult)) {
            throw new FastApiClientException("FastAPI " + endpoint + " returned a malformed or unexpected response", null);
        }
        return response.getResults();
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "upload.pdf";
        }
        return fileName.replaceAll("[\\r\\n\\\\/\"]", "_");
    }

    private boolean isMalformedResult(FastApiStandardResult result) {
        return result == null || result.getIsNumber() == null || result.getTitle() == null || result.getScore() == null;
    }

    private boolean hasTimeoutCause(Throwable exception) {
        Throwable cause = exception;
        while (cause != null) {
            if (cause instanceof HttpTimeoutException || cause instanceof SocketTimeoutException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }
}
