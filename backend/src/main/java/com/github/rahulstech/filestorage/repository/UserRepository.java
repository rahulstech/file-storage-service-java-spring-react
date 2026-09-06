package com.github.rahulstech.filestorage.repository;

import com.github.rahulstech.filestorage.entity.UserEntity;
import lombok.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<@NonNull UserEntity, @NonNull String> {

    Optional<UserEntity> findAllByEmail(@NonNull String email);

    boolean existsByEmail(@NonNull String email);
}
