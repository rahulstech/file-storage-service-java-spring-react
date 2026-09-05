package com.github.rahulstech.filestorage.service;

import com.github.rahulstech.filestorage.dto.AddFileRequest;
import com.github.rahulstech.filestorage.dto.AddFileResponse;
import com.github.rahulstech.filestorage.dto.FileResponse;
import com.github.rahulstech.filestorage.dto.TrashResponse;
import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.entity.FolderEntity;
import com.github.rahulstech.filestorage.error.HttpException;
import com.github.rahulstech.filestorage.repository.FileRepository;
import com.github.rahulstech.filestorage.repository.FolderRepository;
import com.github.rahulstech.filestorage.util.Constants;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService  {

    private final FileRepository fileRepo;

    private final FolderRepository folderRepo;

    private final StorageService storageSrvc;


    public AddFileResponse addSingleFile(String userId, AddFileRequest request) {

        // check if the full path exists or not
        // if exists throw error
        if (fileRepo.existsByFolderIdAndName(request.folder_id(), request.file_name())) {
            throw fileAlreadyExists(request.file_name());
        }

        // get folder by id
        FolderEntity folder = getFolderOrNull(request.folder_id());

        // create the temp storage key
        String tempKey = storageSrvc.createTempStorageKey();

        // create the signed upload url
        StorageService.GetSignedPutUrlParams params = new StorageService.GetSignedPutUrlParams(
                tempKey,
                request.size_bytes(),
                request.mime_type()
        );
        String uploadUrl = storageSrvc.getSingedPutUrl(params);

        // crate new FileEntity object with the tempKey as storageUri
        FileEntity file = FileEntity.builder()
                .userId(userId)
                .name(request.file_name())
                .folderId(null == folder ? null : folder.getId())
                .mimeType(request.mime_type())
                .sizeBytes(BigInteger.valueOf(request.size_bytes()))
                .existsInStorage(false)
                .storageURI(tempKey) // Important
                .cdnURI(null)
                .build();

        // save in db and get the fileId
        FileEntity savedFile = fileRepo.saveAndFlush(file);
        String fileId = savedFile.getId().toString();

        // return the file id with the file upload url
        return new AddFileResponse(uploadUrl, fileId);
    }

    public FileResponse confirmFileUpload(String userId, UUID fileId) {
        // get the file by id
        FileEntity file = fileRepo.findById(fileId)
                .orElseThrow(()-> fileNotFound(fileId));

        if (file.isExistsInStorage()) {
            return FileResponse.fromEntity(file);
        }

        // get the tempKey i.e. storageUri
        String tempKey = file.getStorageURI();

        // copy to user's private storage
        String privateStorageKey = storageSrvc.createUserPrivateStorageKey(userId);
        storageSrvc.copyObject(tempKey, privateStorageKey);

        // update file in db
        String cdnUri = storageSrvc.getCDNUriForKey(privateStorageKey);
        file.setStorageURI(privateStorageKey);
        file.setExistsInStorage(true);
        file.setCdnURI(cdnUri);

        FileEntity savedFile = fileRepo.saveAndFlush(file);

        return FileResponse.fromEntity(savedFile);
    }

    public List<AddFileResponse> addMultipleFiles(List<AddFileRequest> requests) {
        throw new RuntimeException("not implemented");
    }

    public void searchDirectChildrenOfParentPathByNameStarts(String parentPath, String keyword) {}

    public void deleteSingleFile(UUID id) {
        // check file exists
        // if not exists return true
        FileEntity file = fileRepo.findById(id).orElse(null);
        if (file == null) {
            return;
        }

        // remove db entry
        fileRepo.deleteById(id);

        // remove file object
        storageSrvc.removeObject(file.getStorageURI());
    }

    public void deleteMultipleFiles(List<FileEntity> files) {
        fileRepo.deleteAllInBatch(files);

        List<String> uri = files.stream().map(FileEntity::getStorageURI).toList();

        storageSrvc.removeMultipleObjects(uri);
    }

    public FileResponse renameFile(@NonNull UUID fileId, @NonNull String newName) {
        FileEntity file = getFileByIdOrThrow(fileId);

        if (fileRepo.existsByFolderIdAndName(file.getFolderId(), newName)) {
            throw fileAlreadyExists(newName);
        }

        file.setName(newName);
        FileEntity savedEntity = fileRepo.saveAndFlush(file);

        return FileResponse.fromEntity(savedEntity);
    }

    public void moveToTrash(@NonNull UUID fileId) {
        FileEntity file = getFileByIdOrThrow(fileId);
        Instant deleteAt = Instant.now().plusMillis(Constants.DELETE_FROM_TRASH_AFTER_MILLIS);

        file.setInTrash(true);
        file.setDeleteScheduledAt(deleteAt);
        fileRepo.saveAndFlush(file);
    }

    public void restoreFromTrash(UUID fileId) {
        FileEntity file = fileRepo.findById(fileId)
                .orElseThrow(()->fileNotFound(fileId));

        file.setInTrash(false);
        file.setDeleteScheduledAt(null);
        fileRepo.saveAndFlush(file);
    }


    private FileEntity getFileByIdOrThrow(UUID fileId) {
        return fileRepo.findById(fileId)
                .orElseThrow(() -> fileNotFound(fileId));
    }

    @Nullable
    private FolderEntity getFolderOrNull(@Nullable UUID folderId) {
        if (null == folderId) return null;
        return folderRepo.findById(folderId)
                .orElseThrow(()-> HttpException.notFound("no folder found for id '"+folderId+"'"));
    }

    private HttpException fileNotFound(UUID fileId) {
        return HttpException.notFound("file with id '"+fileId+"' not found");
    }

    private HttpException fileAlreadyExists(String name) {
        return HttpException.conflict("file with name '"+name+"' already exists");
    }
}
