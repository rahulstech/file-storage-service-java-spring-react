package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.AuthenticatedUser;
import com.github.rahulstech.filestorage.dto.CreateFolderRequest;
import com.github.rahulstech.filestorage.dto.FolderResponse;
import com.github.rahulstech.filestorage.dto.FolderContentResponse;
import com.github.rahulstech.filestorage.dto.RenameFolderRequest;
import com.github.rahulstech.filestorage.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderSrvc;


    @GetMapping("/root/listContent")
    public FolderContentResponse getRootFolderContent(@AuthenticationPrincipal AuthenticatedUser user) {
        return folderSrvc.listRoot(user.id());
    }

    @GetMapping("/{folderId}/listContent")
    public FolderContentResponse getFolderContent(@PathVariable UUID folderId) {
        return folderSrvc.listFolder(folderId);
    }

    @PostMapping("/createFolder")
    public FolderResponse createFolder(@Valid @RequestBody CreateFolderRequest request, @AuthenticationPrincipal AuthenticatedUser user) {
        return folderSrvc.createFolder(user.id(), request.name(), request.parent_folder_id());
    }

    @DeleteMapping("/{folderId}/moveToTrash")
    public ResponseEntity<@NonNull Void> moveToTrash(@PathVariable UUID folderId) {
        folderSrvc.moveToTrash(folderId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{folderId}/renameFolder")
    public FolderResponse renameFolder(@PathVariable UUID folderId, @Valid @RequestBody RenameFolderRequest request) {
        return folderSrvc.renameFolder(folderId, request.name());
    }
}
