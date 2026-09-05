package com.github.rahulstech.filestorage.service;

import com.github.rahulstech.filestorage.dto.TrashRequest;
import com.github.rahulstech.filestorage.dto.TrashResponse;
import com.github.rahulstech.filestorage.entity.TrashEntity;
import com.github.rahulstech.filestorage.repository.TrashRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrashService {

    private final TrashRepository trashRepo;

    private final FileService fileSrvc;

    private final FolderService folderSrvc;

    public List<TrashResponse> getTrashContent(@NonNull String userId) {
        List<TrashEntity> items = trashRepo.findAllByUserIdOrderByDeleteScheduledAtDesc(userId);

        return items.stream().map(TrashResponse::fromEntity).toList();
    }

    public void restoreFromTrash(TrashRequest request) {
        TrashEntity.Type type = TrashEntity.Type.valueOf(request.type());

        if (type == TrashEntity.Type.FILE) {
            fileSrvc.restoreFromTrash(request.id());
        }
        else {
            folderSrvc.restoreFromTrash(request.id());
        }
    }

    public void removePermanentlyFromTrash(TrashRequest request) {
        TrashEntity.Type type = TrashEntity.Type.valueOf(request.type());

        if (type == TrashEntity.Type.FILE) {
            fileSrvc.deleteSingleFile(request.id());
        }
        else {
            folderSrvc.removeFolder(request.id());
        }
    }
}
