package com.github.rahulstech.filestorage.dto;

import org.springframework.http.HttpStatus;

import java.util.Map;

/**
 * Standard error response model returned by the API.
 * Uses a sealed interface to support either a single simple message
 * or a map of specific field validation failures.
 */
public sealed interface ErrorResponse {

    /**
     * Represents a single generic or system error message.
     */
    record SimpleError(String message) implements ErrorResponse {}

    /**
     * Represents multiple field-level validation errors.
     * Maps each invalid field name to its corresponding error message.
     */
    record FieldError(Map<String, String> reasons) implements ErrorResponse {}
}