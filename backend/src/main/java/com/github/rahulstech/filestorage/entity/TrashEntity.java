package com.github.rahulstech.filestorage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trash")
@Immutable
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class TrashEntity {

    public enum Type {
        FILE,

        FOLDER
    }

    @Embeddable
    public record TrashItemId(
            UUID id,
            @Enumerated(EnumType.STRING)
            Type type
    ) {}

    @EmbeddedId
    private TrashItemId id;

    @Column(name = "user_id")
    private String userId;

    private String name;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "delete_scheduled_at")
    private Instant deleteScheduledAt;
}
