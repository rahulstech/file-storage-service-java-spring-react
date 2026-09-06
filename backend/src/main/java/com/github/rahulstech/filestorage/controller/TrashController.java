package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.AuthenticatedUser;
import com.github.rahulstech.filestorage.dto.TrashResponse;
import com.github.rahulstech.filestorage.dto.TrashRequest;
import com.github.rahulstech.filestorage.service.TrashService;
import jakarta.validation.Valid;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trash")
@RequiredArgsConstructor
public class TrashController {

    private final TrashService trashSrvc;

    @GetMapping("/listContent")
    public List<TrashResponse> getTrashContent(@AuthenticationPrincipal AuthenticatedUser user) {
        return trashSrvc.getTrashContent(user.id());
    }

    @PostMapping("/restore")
    public void restore(@Valid @RequestBody TrashRequest body) {
        trashSrvc.restoreFromTrash(body);
    }

    @DeleteMapping("/remove")
    public ResponseEntity<@NonNull Void> removePermanently(@Valid @RequestBody TrashRequest body) {
        trashSrvc.removePermanentlyFromTrash(body);
        return ResponseEntity.noContent().build();
    }
}
