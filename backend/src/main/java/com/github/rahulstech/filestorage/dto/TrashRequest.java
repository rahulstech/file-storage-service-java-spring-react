package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TrashRequest(
        @NotNull(message = "id is required")
        UUID id,

        @NotEmpty(message = "type is required")
        String type
) {}
