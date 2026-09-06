package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(
        @NotEmpty(message = "email is required")
        @Email(message = "invalid email")
        String email,

        @NotEmpty(message = "password is required")
        @Size(min = 8, max = 16, message = "password must be with in 8 and 16 characters")
        String password,

        @NotEmpty(message = "name is required")
        String name
) {}