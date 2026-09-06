package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(
        @NotEmpty(message = "email is required")
        @Email(message = "invalid email")
        String email,

        @NotEmpty(message = "password is required")
        @Size(min = 8, max = 16, message = "password must be with in 8 and 16 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,16}$",
                message = "only alpha numeric and special characters allowed"
        )
        String password,

        @NotEmpty(message = "name is required")
        @Pattern(
                regexp = "^[\\p{L}\\p{N} \\t]+$",
                message = "Name can contain only letters, numbers, spaces and tabs."
        )
        String name
) {}