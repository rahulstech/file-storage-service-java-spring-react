package com.github.rahulstech.filestorage;

import java.util.UUID;

public record AuthenticatedUser(
        UUID id,
        String email
) {}
