package com.procureiq.service;

public class FastApiClientException extends RuntimeException {

    public FastApiClientException(String message, Throwable cause) {
        super(message, cause);
    }
}
