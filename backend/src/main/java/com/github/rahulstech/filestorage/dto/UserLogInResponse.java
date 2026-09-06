package com.github.rahulstech.filestorage.dto;

public record UserLogInResponse(
        String authToken,
        String name,
        String email
) {}
