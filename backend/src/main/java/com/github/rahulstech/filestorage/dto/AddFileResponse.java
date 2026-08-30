package com.github.rahulstech.filestorage.dto;

public record AddFileResponse(
        String upload_url,
        String file_id
) {}
