package com.github.rahulstech.filestorage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigInteger;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode
@Builder

@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "file_name", nullable = false)
    private String name;

    @Column(name = "folder_id", nullable = false)
    private UUID folderId;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private BigInteger sizeBytes;

    @Column(name = "in_trash", nullable = false)
    @ColumnDefault("false")
    private boolean inTrash;

    @Column(name = "storage_uri")
    private String storageURI;

    @Column(name = "exists_in_storage", nullable = false)
    @ColumnDefault("false")
    private boolean existsInStorage;

    @Column(name = "cdn_uri")
    private String cdnURI;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private Instant updatedAt;
}
