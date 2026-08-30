package com.github.rahulstech.filestorage.repository;

import com.github.rahulstech.filestorage.entity.FolderEntity;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<@NonNull FolderEntity, @NonNull UUID> {

    List<FolderEntity> findAllByUserIdAndParentFolderIdIsNull(@NonNull String userId);
}
