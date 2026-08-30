package com.github.rahulstech.filestorage.dto;

import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.entity.FolderEntity;
import com.github.rahulstech.filestorage.util.DateTimeUtils;
import org.jspecify.annotations.Nullable;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record FolderListResponse(
        UUID folder_id,
        String abs_path,
        List<Item> children
) {
    public record Item(
            String id,
            Type type,
            String name,
            @Nullable BigInteger size_bytes,
            LocalDateTime updated_at
    ) implements Comparable<Item> {

        public enum Type {
            FOLDER,
            FILE
        }

        @Override
        public int compareTo(Item o) {
            if (null == o) return 1;
            return Comparator
                    .comparing(Item::type)
                    .thenComparing(Item::name)
                    .thenComparing(Item::updated_at)
                    .compare(this, o);
        }



        public static Item fromFileEntity(FileEntity file) {
            return new Item(
                    file.getId().toString(),
                    Type.FILE,
                    file.getName(),
                    file.getSizeBytes(),
                    DateTimeUtils.instantToLocalDateTimeAtUTC(file.getUpdatedAt())
            );
        }

        public static Item fromFolderEntity(FolderEntity file) {
            return new Item(
                    file.getId().toString(),
                    Type.FOLDER,
                    file.getName(),
                    null,
                    DateTimeUtils.instantToLocalDateTimeAtUTC(file.getUpdatedAt())
            );
        }
    }
}
