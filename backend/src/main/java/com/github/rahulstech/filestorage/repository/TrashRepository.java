package com.github.rahulstech.filestorage.repository;

import com.github.rahulstech.filestorage.entity.TrashEntity;
import lombok.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrashRepository extends JpaRepository<@NonNull TrashEntity, TrashEntity.@NonNull TrashItemId> {

    List<TrashEntity> findAllByUserIdOrderByDeleteScheduledAtDesc(@NonNull String userId);
}
