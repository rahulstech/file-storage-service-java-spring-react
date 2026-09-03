package com.github.rahulstech.filestorage.dto;

import java.util.UUID;

public record CreateFolderResponse(
        UUID folder_id,
        String name,
        String abs_path
) {}
