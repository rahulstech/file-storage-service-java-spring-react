package com.github.rahulstech.filestorage.service;

import com.github.rahulstech.filestorage.dto.AddFileRequest;
import com.github.rahulstech.filestorage.dto.AddFileResponse;
import com.github.rahulstech.filestorage.dto.FileResponse;
import com.github.rahulstech.filestorage.entity.FileEntity;
import com.github.rahulstech.filestorage.entity.FolderEntity;
import com.github.rahulstech.filestorage.error.HttpException;
import com.github.rahulstech.filestorage.repository.FileRepository;
import com.github.rahulstech.filestorage.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService  {

    private final FileRepository fileRepo;

    private final FolderRepository folderRepo;

    private final StorageService storageSrvc;


    public AddFileResponse addSingleFile(String userId, AddFileRequest request) {
        // TODO: verify the parent path and the file name

        // check if the full path exists or not
        // if exists throw error
        if (fileRepo.existsByFolderIdAndName(request.folder_id(), request.file_name())) {
            // TODO: throw error file already exists
            throw new RuntimeException("file already exists");
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
                .folderId(folder.getId())
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
        // get the file meta by id
        FileEntity file = fileRepo.findById(fileId).orElseThrow(); // TODO: throw not found

        if (file.isExistsInStorage()) {
            // TODO: file already exists throw already exists
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

    public void renameFile() {}

    public void getChildrenOfParentPath(String parentPath) {}

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

    public void deleteMultipleFilesById(List<UUID> ids) {
        List<FileEntity> files = fileRepo.findAllById(ids);
        deleteMultipleFiles(files);
    }

    public void deleteMultipleFiles(List<FileEntity> files) {
        fileRepo.deleteAllInBatch(files);

        List<String> uri = files.stream().map(FileEntity::getStorageURI).toList();

        storageSrvc.removeMultipleObjects(uri);
    }

    @Nullable
    private FolderEntity getFolderOrNull(@Nullable UUID folderId) {
        if (null == folderId) return null;
        return folderRepo.findById(folderId)
                .orElseThrow(()-> HttpException.notFound("no folder found for id '"+folderId+"'"));
    }
}
