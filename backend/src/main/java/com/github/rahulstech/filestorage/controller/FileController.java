package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.AuthenticatedUser;
import com.github.rahulstech.filestorage.dto.AddFileRequest;
import com.github.rahulstech.filestorage.dto.AddFileResponse;
import com.github.rahulstech.filestorage.dto.FileResponse;
import com.github.rahulstech.filestorage.dto.RenameFileRequest;
import com.github.rahulstech.filestorage.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileSrvc;

    @PostMapping("/addSingle")
    public AddFileResponse addFile(@Valid @RequestBody AddFileRequest body, @AuthenticationPrincipal AuthenticatedUser user) {
        return fileSrvc.addSingleFile(user.id(), body);
    }

    @PutMapping("/{fileId}/confirmUpload")
    public FileResponse confirmUpload(@PathVariable UUID fileId, @AuthenticationPrincipal AuthenticatedUser user) {
        return fileSrvc.confirmFileUpload(user.id(), fileId);
    }

    @DeleteMapping("/{fileId}/moveToTrash")
    public ResponseEntity<@NonNull Void> moveToTrash(@PathVariable UUID fileId) {
        fileSrvc.moveToTrash(fileId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{fileId}/renameFile")
    public FileResponse renameFile(@PathVariable UUID fileId, @Valid @RequestBody RenameFileRequest body) {
        return fileSrvc.renameFile(fileId, body.name());
    }
}
