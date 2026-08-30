package com.github.rahulstech.filestorage.error;

import com.github.rahulstech.filestorage.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Intercepts exceptions thrown by controllers and translates them
 * into uniform, structured JSON error responses.
 */
@Slf4j
@RestControllerAdvice
public class GlobalErrorHandler {

    /**
     * Translates application HttpException instances into appropriate
     * HTTP response entities carrying a simple error message.
     */
    @ExceptionHandler(HttpException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleHttpException(HttpException e) {
        var body = new ErrorResponse.SimpleError(e.getMessage());
        return ResponseEntity.status(e.status).body(body);
    }

    /**
     * Processes controller validation failures. Logs the failed URI path at ERROR level
     * and maps each rejected field's cause into a detailed debug string and a JSON response.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleValidationException(
            MethodArgumentNotValidException e, HttpServletRequest request) {

        // Log the endpoint path that failed validation
        log.error("Request body validation failed on path: {}", request.getRequestURI());

        // Log specific field names and values for debugging
        if (log.isDebugEnabled()) {
            String debugDetails = e.getBindingResult().getFieldErrors().stream()
                    .map(error -> String.format("field='%s', value='%s', message='%s'",
                            error.getField(), error.getRejectedValue(), error.getDefaultMessage()))
                    .collect(Collectors.joining("; "));
            log.debug("Validation failure details: {}", debugDetails);
        }

        // Collect distinct field validation errors into a map.
        // If the same field fails multiple constraints, the first message is retained.
        Map<String, String> reasons = e.getBindingResult().getFieldErrors().stream()
                .filter(error -> error.getDefaultMessage() != null)
                .collect(Collectors.toMap(
                        FieldError::getField,
                        FieldError::getDefaultMessage,
                        (existing, replacement) -> existing
                ));

        var body = new ErrorResponse.FieldError(reasons);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Processes missing or unreadable request body failures. Logs the failed URI path at ERROR level
     * and returns a FieldError response.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException e, HttpServletRequest request) {

        log.error("Request body on path: {} has error {}", request.getRequestURI(), e.getMessage());

        var body = new ErrorResponse.SimpleError("Required request body is missing or unreadable");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Handles unsupported HTTP methods (405 Method Not Allowed).
     * Logs the HTTP request method and path at ERROR level.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleMethodNotSupportedException(
            HttpRequestMethodNotSupportedException e, HttpServletRequest request) {

        log.error("HTTP method {} is not supported for path: {}", request.getMethod(), request.getRequestURI());

        var body = new ErrorResponse.SimpleError("Request method is not supported");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    /**
     * Handles endpoint or resource not found exceptions (404 Not Found).
     * Logs the requested method and path at ERROR level.
     */
    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<@NonNull ErrorResponse> handleNotFoundException(
            Exception e, HttpServletRequest request) {

        log.error("Path not found for method {} at URI: {}", request.getMethod(), request.getRequestURI());

        var body = new ErrorResponse.SimpleError("Path not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Catches any unhandled Throwable or system exception.
     * Logs full stack trace at ERROR level and returns a generic 500 Internal Server Error response.
     */
    @ExceptionHandler(Throwable.class)
    public ResponseEntity<@NonNull ErrorResponse> handleUnhandledThrowable(
            Throwable e, HttpServletRequest request) {

        log.error("Unhandled exception on path {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage(), e);

        var body = new ErrorResponse.SimpleError("An internal server error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
