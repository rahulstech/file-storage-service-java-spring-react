package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.dto.AddFileRequest;
import com.github.rahulstech.filestorage.dto.AddFileResponse;
import com.github.rahulstech.filestorage.dto.FileResponse;
import com.github.rahulstech.filestorage.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileSrvc;

    @PostMapping("/addSingle")
    public AddFileResponse addFile(@RequestBody AddFileRequest request) {
        return fileSrvc.addSingleFile("USER1", request); // TODO: add user id
    }

    @PutMapping("/{fileId}/confirmUpload")
    public FileResponse confirmUpload(@PathVariable UUID fileId) {
        return fileSrvc.confirmFileUpload("USER1", fileId);
    }
}
