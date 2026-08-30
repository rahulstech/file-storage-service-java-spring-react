package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.dto.FolderListResponse;
import com.github.rahulstech.filestorage.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderSrvc;


    @GetMapping("/root/listContent")
    public FolderListResponse getRootFolderContent() {
        return folderSrvc.listRoot("USER1");
    }

    @GetMapping("/{folderId}/listContent")
    public FolderListResponse getFolderContent(@PathVariable UUID folderId) {
        return folderSrvc.listFolder(folderId);
    }
}
