package com.github.rahulstech.filestorage.dto;

import com.github.rahulstech.filestorage.entity.FolderEntity;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

public record FolderResponse(
        UUID folder_id,
        @Nullable UUID parent_folder_id,
        String name
) {

    public static FolderResponse fromEntity(FolderEntity entity) {
        return new FolderResponse(entity.getId(), entity.getParentFolderId(), entity.getName());
    }
}
