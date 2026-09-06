package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.ToString;
import org.jspecify.annotations.NonNull;

public record UserLogInRequest(
        @NotEmpty(message = "email is required")
        @Email(message = "invalid email")
        String email,

        @NotEmpty(message = "password is required")
        String password
) {

    @NonNull
    @Override
    public String toString() {
        return "UserLogInRequest{" +
                "email='" + email + '\'' +
                ", password='" + password + '\'' +
                '}';
    }
}
