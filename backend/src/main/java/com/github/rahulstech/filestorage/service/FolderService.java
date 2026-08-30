package com.github.rahulstech.filestorage.service;

import com.github.rahulstech.filestorage.dto.FolderListResponse;
import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.entity.FolderEntity;
import com.github.rahulstech.filestorage.error.HttpException;
import com.github.rahulstech.filestorage.repository.FileRepository;
import com.github.rahulstech.filestorage.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepo;

    private final FileRepository fileRepo;

    public FolderListResponse listFolder(UUID folderId) {
        FolderEntity parent =  folderRepo.findById(folderId)
                .orElseThrow(() -> HttpException.notFound("no folder with id '"+folderId+"' found for the user")); // TODO: throw not found

        List<FolderEntity> dirs = parent.getChildFolders();
        List<FileEntity> files = parent.getFiles();

        List<FolderListResponse.Item> children = Stream.concat(
                dirs.stream().map(FolderListResponse.Item::fromFolderEntity),
                files.stream().map(FolderListResponse.Item::fromFileEntity)
        ).sorted(Comparator.nullsLast(FolderListResponse.Item::compareTo)).toList();

        String abs_path = buildAbsolutePath(parent);

        return new FolderListResponse(
                folderId,
                abs_path,
                children
        );
    }

    public FolderListResponse listRoot(String userId) {
        List<FolderEntity> dirs = folderRepo.findAllByUserIdAndParentFolderIdIsNull(userId);
        List<FileEntity> files = fileRepo.findAllByUserIdAndFolderIdIsNull(userId);

        List<FolderListResponse.Item> children = Stream.concat(
                dirs.stream().map(FolderListResponse.Item::fromFolderEntity),
                files.stream().map(FolderListResponse.Item::fromFileEntity)
        ).sorted(Comparator.nullsLast(FolderListResponse.Item::compareTo)).toList();

        return new FolderListResponse(
                null,
                "/",
                children
        );
    }

    private String buildAbsolutePath(FolderEntity folder) {
        Deque<String> parts = new ArrayDeque<>();

        for (FolderEntity current = folder; current != null; current = current.getParentFolder()) {
            parts.addFirst(current.getName());
        }

        return "/" + String.join("/", parts);
    }
}
