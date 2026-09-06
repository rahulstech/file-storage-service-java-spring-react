package com.github.rahulstech.filestorage.service;

import com.github.rahulstech.filestorage.dto.FolderResponse;
import com.github.rahulstech.filestorage.dto.FolderContentResponse;
import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.entity.FolderEntity;
import com.github.rahulstech.filestorage.error.HttpException;
import com.github.rahulstech.filestorage.repository.FileRepository;
import com.github.rahulstech.filestorage.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final Logger log = LoggerFactory.getLogger(FolderService.class);

    private final FolderRepository folderRepo;

    private final FileRepository fileRepo;

    private final FileService fileSrvc;

    public FolderContentResponse listFolder(UUID folderId) {
        FolderEntity parent =  folderRepo.findById(folderId)
                .orElseThrow(() -> folderNotFound(folderId));

        List<FolderEntity> dirs = getChildFolders(parent);
        List<FileEntity> files = getFilesOfFolder(parent);

        List<FolderContentResponse.Item> children = Stream.concat(
                dirs.stream().map(FolderContentResponse.Item::fromFolderEntity),
                files.stream().map(FolderContentResponse.Item::fromFileEntity)
        ).sorted(Comparator.nullsLast(FolderContentResponse.Item::compareTo)).toList();

        String abs_path = buildAbsolutePath(parent);

        return new FolderContentResponse(
                folderId,
                abs_path,
                children
        );
    }

    public FolderContentResponse listRoot(UUID userId) {
        List<FolderEntity> dirs = folderRepo.findAllByInTrashIsFalseAndUserIdAndParentFolderIdIsNull(userId);
        List<FileEntity> files = fileRepo.findAllByInTrashIsFalseAndUserIdAndFolderIdIsNull(userId);

        List<FolderContentResponse.Item> children = Stream.concat(
                dirs.stream().map(FolderContentResponse.Item::fromFolderEntity),
                files.stream().map(FolderContentResponse.Item::fromFileEntity)
        ).sorted(Comparator.nullsLast(FolderContentResponse.Item::compareTo)).toList();

        return new FolderContentResponse(
                null,
                "/",
                children
        );
    }

    public FolderResponse createFolder(@NonNull UUID userId, @NonNull String name, @Nullable UUID parentFolderId) {

        // check parent folder exists
        if (null != parentFolderId && !folderRepo.existsById(parentFolderId)) {
            throw HttpException.notFound("no folder found for id '"+parentFolderId+"'");
        }

        // check if new folder already exists
        if (folderRepo.existsByParentFolderIdAndName(parentFolderId, name)) {
            throw folderAlreadyExists(name);
        }

        // create the folder
        FolderEntity newFolder = FolderEntity.builder()
                .name(name)
                .userId(userId)
                .parentFolderId(parentFolderId)
                .build();
        FolderEntity savedFolder = folderRepo.saveAndFlush(newFolder);

        return FolderResponse.fromEntity(savedFolder);
    }

    public void removeFolder(@NonNull UUID folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(()-> folderNotFound(folderId));

        removeFolder(folder);
    }

    public FolderResponse renameFolder(UUID folderId, String newName) {
        FolderEntity folder = getFolderByIdOrThrow(folderId);

        if (folderRepo.existsByParentFolderIdAndName(folder.getParentFolderId(), newName)) {
            throw  folderAlreadyExists(newName);
        }

        folder.setName(newName);
        FolderEntity savedEntity = folderRepo.saveAndFlush(folder);

        return FolderResponse.fromEntity(savedEntity);
    }

    private void removeFolder(@NonNull FolderEntity folder) {

        // remove the children files
        List<FileEntity> files = getFilesOfFolder(folder);
        if (!files.isEmpty()) {
            fileSrvc.deleteMultipleFiles(files);
        }

        // remove the children folders
        List<FolderEntity> childFolders = getChildFolders(folder);
        for (FolderEntity childFolder : childFolders) {
            removeFolder(childFolder);
        }

        // delete the target folder itself
        folderRepo.delete(folder);
    }

    public void moveToTrash(@NonNull UUID folderId) {
        FolderEntity folder = getFolderByIdOrThrow(folderId);

        folder.setInTrash(true);
        folderRepo.saveAndFlush(folder);
    }

    public void restoreFromTrash(UUID folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(()->folderNotFound(folderId));

        folder.setInTrash(false);
        folderRepo.saveAndFlush(folder);
    }

    @NonNull
    private FolderEntity getFolderByIdOrThrow(@NonNull UUID folderId) {
        return folderRepo.findById(folderId)
                .orElseThrow(()-> folderNotFound(folderId));
    }

    private String buildAbsolutePath(FolderEntity folder) {
        Deque<String> parts = new ArrayDeque<>();

        for (FolderEntity current = folder; current != null; current = getParentFolder(current)) {
            parts.addFirst(current.getName());
        }

        return "/" + String.join("/", parts);
    }

    @Nullable
    private FolderEntity getParentFolder(FolderEntity folder) {
        if (null == folder.getParentFolderId()) {
            return null;
        }
        return getFolderByIdOrThrow(folder.getParentFolderId());
    }

    private List<FolderEntity> getChildFolders(FolderEntity folder) {
        return folderRepo.findAllByParentFolderId(folder.getId());
    }

    private List<FileEntity> getFilesOfFolder(FolderEntity folder) {
        return fileRepo.findAllByFolderId(folder.getId());
    }

    private HttpException folderNotFound(UUID folderId) {
        return HttpException.notFound("folder with id '"+folderId+"' not found");
    }

    private HttpException folderAlreadyExists(String name) {
        return HttpException.conflict("folder with name '"+name+"' already exists");
    }
}
