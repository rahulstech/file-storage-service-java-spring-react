package com.github.rahulstech.filestorage.dto;

import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.util.DateTimeUtils;
import lombok.Builder;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record FileResponse(
        UUID file_id,
        String file_name,
        String mime_type,
        BigInteger size_bytes,
        String cdn_uri,
        LocalDateTime updated_at
) {

    public static FileResponse fromEntity(FileEntity entity) {
        return FileResponse.builder()
                .file_id(entity.getId())
                .file_name(entity.getName())
                .mime_type(entity.getMimeType())
                .size_bytes(entity.getSizeBytes())
                .cdn_uri(entity.getCdnURI())
                .updated_at(DateTimeUtils.instantToLocalDateTimeAtUTC(entity.getUpdatedAt()))
                .build();
    }
}
