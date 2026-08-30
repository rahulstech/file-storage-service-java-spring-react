package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

public record AddFileRequest(
        @NotBlank(message = "folder_id can not be blank")
        @Nullable
        UUID folder_id,

        @NotBlank(message = "file_name is required")
        String file_name,

        @Min(value = 0)
        @Max(value = 536870912 /* 512 mb*/, message = "size_bytes must not with in 512 mb")
        Long size_bytes,

        @NotBlank(message = "mimeType is required")
        @Size(min = 3, message = "mime_type value not accepted")
        String mime_type
) {
}
