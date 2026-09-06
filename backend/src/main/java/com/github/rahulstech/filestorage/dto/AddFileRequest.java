package com.github.rahulstech.filestorage.dto;

import jakarta.validation.constraints.*;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

public record AddFileRequest(

        @Nullable
        UUID folder_id,

        @NotEmpty(message = "file_name is required")
        @Size(max = 255, message = "file_name must be with in 255 characters")
        @Pattern(regexp = "^(?!\\.{1,2}$)[^\\x00/\\\\]+$", message = "file_name is not a valid file name")
        String file_name,

        @Min(value = 0)
        @Max(value = 536870912 /* 512 mb*/, message = "size_bytes must not with in 512 mb")
        Long size_bytes,

        @NotBlank(message = "mimeType is required")
        @Size(min = 3, message = "mime_type value not accepted")
        String mime_type
) {}
