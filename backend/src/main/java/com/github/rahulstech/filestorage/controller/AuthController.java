package com.github.rahulstech.filestorage.controller;

import com.github.rahulstech.filestorage.dto.RegisterUserRequest;
import com.github.rahulstech.filestorage.dto.UserLogInRequest;
import com.github.rahulstech.filestorage.dto.UserLogInResponse;
import com.github.rahulstech.filestorage.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService userSrvc;

    @PostMapping("/registerUser")
    public ResponseEntity<@NonNull UserLogInResponse> registerUser(@Valid @RequestBody RegisterUserRequest body) {
        UserLogInResponse response = userSrvc.createUser(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/userLogIn")
    public UserLogInResponse userLogIn(@RequestBody UserLogInRequest body) {
        return userSrvc.loginUser(body);
    }
}
