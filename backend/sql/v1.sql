create table users
(
    id            uuid                     not null
        primary key,
    email         text                     not null,
    password_hash varchar(100),
    name          text                     not null,
    created_at    timestamp with time zone not null,
    updated_at    timestamp with time zone not null
);

create unique index unq_users_email
    on users (email);

create table folders
(
    id               uuid                     not null
        primary key,
    user_id          uuid                     not null
        references users
            on delete cascade,
    name             text                     not null,
    parent_folder_id uuid,
    in_trash         boolean default false    not null,
    created_at       timestamp with time zone not null,
    updated_at       timestamp with time zone not null
);

create index if not exists idx_folders_user_id on folders(user_id);

create unique index if not exists unq_folders_parent_folder_id_name on folders(parent_folder_id, name);

create table files
(
    id                uuid                     not null
        primary key,
    user_id           uuid                     not null
        references users
            on delete cascade,
    file_name         varchar(255)             not null,
    folder_id         uuid
        references folders
            on delete restrict,
    mime_type         varchar(50)              not null,
    size_bytes        bigint                   not null,
    storage_uri       text,
    exists_in_storage boolean default false    not null,
    in_trash          boolean default false    not null,
    cdn_uri           text,
    created_at        timestamp with time zone not null,
    updated_at        timestamp with time zone not null
);

create index if not exists idx_files_users on files(user_id);

create index if not exists unq_files_folder_id_file_name on files(folder_id, file_name);


create view trash(id, user_id, name, parent_id, type, updated_at) as
SELECT files.id,
       files.user_id,
       files.file_name AS name,
       files.folder_id AS parent_id,
       'FILE'::text    AS type,
       files.updated_at
FROM files
WHERE files.in_trash = true
UNION
SELECT folders.id,
       folders.user_id,
       folders.name,
       folders.parent_folder_id AS parent_id,
       'FOLDER'::text           AS type,
       folders.updated_at
FROM folders
WHERE folders.in_trash = true;
