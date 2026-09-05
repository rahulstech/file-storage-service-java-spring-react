package com.github.rahulstech.filestorage.dto;

import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.entity.FolderEntity;
import com.github.rahulstech.filestorage.entity.TrashEntity;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

public record TrashResponse(
        UUID id,
        @Nullable UUID parent_id,
        String name,
        String type
) {

    public static TrashResponse fromEntity(TrashEntity entity) {
        return new TrashResponse(
                entity.getId().id(),
                entity.getParentId(),
                entity.getName(),
                entity.getId().type().name()
        );
    }

    public static TrashResponse fromFileEntity(FileEntity entity) {
        return new TrashResponse(
                entity.getId(),
                entity.getFolderId(),
                entity.getName(),
                TrashEntity.Type.FILE.name()
        );
    }

    public static TrashResponse fromFolderEntity(FolderEntity entity) {
        return new TrashResponse(
                entity.getId(),
                entity.getParentFolderId(),
                entity.getName(),
                TrashEntity.Type.FOLDER.name()
        );
    }
}
