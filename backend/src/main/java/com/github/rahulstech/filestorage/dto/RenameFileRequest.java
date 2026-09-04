package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RenameFileRequest(
        @NotEmpty(message = "name is required")
        @Size(max = 255, message = "name must be with in 255 characters")
        @Pattern(regexp = "^(?!\\.{1,2}$)[a-zA-Z0-9._-]+(?: [a-zA-Z0-9._-]+)*$", message = "name is not a valid file name")
        String name
) {}
