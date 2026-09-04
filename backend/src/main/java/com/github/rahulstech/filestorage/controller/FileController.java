package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.dto.AddFileRequest;
import com.github.rahulstech.filestorage.dto.AddFileResponse;
import com.github.rahulstech.filestorage.dto.FileResponse;
import com.github.rahulstech.filestorage.dto.RenameFileRequest;
import com.github.rahulstech.filestorage.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileSrvc;

    @PostMapping("/addSingle")
    public AddFileResponse addFile(@Valid @RequestBody AddFileRequest body) {
        return fileSrvc.addSingleFile("USER1", body); // TODO: add user id
    }

    @PutMapping("/{fileId}/confirmUpload")
    public FileResponse confirmUpload(@PathVariable UUID fileId) {
        return fileSrvc.confirmFileUpload("USER1", fileId);
    }


    @DeleteMapping("/{fileId}/removeFile")
    public ResponseEntity<@NonNull Void> removeFile(@PathVariable UUID fileId) {
        fileSrvc.deleteSingleFile(fileId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{fileId}/renameFile")
    public FileResponse renameFile(@PathVariable UUID fileId, @Valid @RequestBody RenameFileRequest body) {
        return fileSrvc.renameFile(fileId, body.name());
    }
}
