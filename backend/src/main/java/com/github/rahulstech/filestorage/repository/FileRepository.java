package com.github.rahulstech.filestorage.repository;

import com.github.rahulstech.filestorage.entity.FileEntity;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<@NonNull FileEntity, @NonNull UUID> {

    List<FileEntity> findAllByInTrashIsFalseAndUserIdAndFolderIdIsNull(@NonNull UUID userId);

    List<FileEntity> findAllByFolderId(@NonNull UUID folderId);

    boolean existsByFolderIdAndName(@Nullable UUID folderId, @NonNull String name);
}
