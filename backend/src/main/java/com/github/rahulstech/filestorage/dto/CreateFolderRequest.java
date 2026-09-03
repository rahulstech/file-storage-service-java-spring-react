package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.NotEmpty;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

public record CreateFolderRequest(
        @Nullable
        UUID parent_folder_id,

        @NotEmpty(message = "name is required")
        String name
) {}
