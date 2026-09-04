package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.dto.CreateFolderRequest;
import com.github.rahulstech.filestorage.dto.FolderResponse;
import com.github.rahulstech.filestorage.dto.FolderContentResponse;
import com.github.rahulstech.filestorage.dto.RenameFolderRequest;
import com.github.rahulstech.filestorage.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderSrvc;


    @GetMapping("/root/listContent")
    public FolderContentResponse getRootFolderContent() {
        return folderSrvc.listRoot("USER1");
    }

    @GetMapping("/{folderId}/listContent")
    public FolderContentResponse getFolderContent(@PathVariable UUID folderId) {
        return folderSrvc.listFolder(folderId);
    }

    @PostMapping("/createFolder")
    public FolderResponse createFolder(@Valid @RequestBody CreateFolderRequest request) {
        return folderSrvc.createFolder("USER1", request.name(), request.parent_folder_id());
    }

    @DeleteMapping("/{folderId}/removeFolder")
    public ResponseEntity<@NonNull Void> removeFolder(@PathVariable UUID folderId) {
        folderSrvc.removeFolder("USER1", folderId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{folderId}/renameFolder")
    public FolderResponse renameFolder(@PathVariable UUID folderId, @Valid @RequestBody RenameFolderRequest request) {
        return folderSrvc.renameFolder(folderId, request.name());
    }
}
