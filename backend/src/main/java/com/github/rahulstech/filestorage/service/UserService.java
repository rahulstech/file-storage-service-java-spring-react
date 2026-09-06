package com.github.rahulstech.filestorage.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.github.rahulstech.filestorage.AuthenticatedUser;
import com.github.rahulstech.filestorage.dto.RegisterUserRequest;
import com.github.rahulstech.filestorage.dto.UserLogInRequest;
import com.github.rahulstech.filestorage.dto.UserLogInResponse;
import com.github.rahulstech.filestorage.entity.UserEntity;
import com.github.rahulstech.filestorage.error.HttpException;
import com.github.rahulstech.filestorage.repository.UserRepository;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserService {

    private static final long AUTH_TOKEN_EXPIRE_SECONDS = 24 * 3600; // 24 hours

    private final UserRepository userRepo;

    private final PasswordEncoder passwordEncoder;

    private final String jwtSecret;

    public UserService(
            UserRepository userRepo,
            PasswordEncoder passwordEncoder,
            @Value("${filestorageservice.jwt.secret}") String jwtSecret
    ) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtSecret = jwtSecret;
    }

    public UserLogInResponse createUser(RegisterUserRequest request) {
        if (userRepo.existsByEmail(request.email())) {
            throw HttpException.conflict("user with email already exists");
        }

        UserEntity newUser = UserEntity.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(hashPassword(request.password()))
                .build();
        UserEntity savedUser = userRepo.saveAndFlush(newUser);
        String authToken = generateAuthToken(savedUser);

        return new UserLogInResponse(authToken, savedUser.getName(), savedUser.getEmail());
    }

    public UserLogInResponse loginUser(UserLogInRequest request) {
        // find by email
        UserEntity user = userRepo.findAllByEmail(request.email())
                .orElseThrow(()-> HttpException.notFound("user not found"));

        // check password has
        if (!verifyPasswordHash(request.password(), user.getPasswordHash())) {
            throw HttpException.unauthorized("incorrect password");
        }

        String authToken = generateAuthToken(user);

        return new UserLogInResponse(authToken, user.getName(), user.getEmail());
    }

    private String hashPassword(String plainPassword) {
        return passwordEncoder.encode(plainPassword);
    }

    private boolean verifyPasswordHash(String plainPassword, String passwordHash) {
        return passwordEncoder.matches(plainPassword, passwordHash);
    }

    private String generateAuthToken(UserEntity user) {
        Instant expiresAt = Instant.now().plusSeconds(AUTH_TOKEN_EXPIRE_SECONDS);

        // Symmetric signing using HMAC256
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);

        return JWT.create()
                .withSubject(user.getId().toString())
                .withClaim("email", user.getEmail())
                .withExpiresAt(expiresAt)
                .sign(algorithm);
    }

    @NonNull
    public AuthenticatedUser verifyToken(String token) {
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        JWTVerifier verifier = JWT.require(algorithm).build();
        DecodedJWT decodedJWT = verifier.verify(token);
        String sub = decodedJWT.getSubject();
        String email = decodedJWT.getClaim("email").asString();

        // NOTE: if verify fails then it throws exception, therefore I can assume that user exists and valid
        UUID userId = UUID.fromString(sub);
        return new AuthenticatedUser(userId, email);
    }
}
