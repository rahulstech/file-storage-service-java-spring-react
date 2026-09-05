package com.github.rahulstech.filestorage.repository;

import com.github.rahulstech.filestorage.entity.FolderEntity;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<@NonNull FolderEntity, @NonNull UUID> {

    List<FolderEntity> findAllByInTrashIsFalseAndUserIdAndParentFolderIdIsNull(@NonNull String userId);

    List<FolderEntity> findAllByParentFolderId(@Nullable UUID parentFolderId);

    boolean existsByParentFolderIdAndName(@Nullable UUID parentFolderId, @NonNull String name);
}
