package com.github.rahulstech.filestorage.dto;

import com.github.rahulstech.filestorage.entity.FolderEntity;

import java.util.UUID;

public record FolderResponse(
        UUID folder_id,
        String name,
        String abs_path
) {

    public static FolderResponse fromEntity(FolderEntity entity, String absPath) {
        return new FolderResponse(entity.getId(), entity.getName(), absPath);
    }
}
