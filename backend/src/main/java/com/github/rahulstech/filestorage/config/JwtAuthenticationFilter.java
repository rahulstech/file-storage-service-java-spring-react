package com.github.rahulstech.filestorage.config;

import com.github.rahulstech.filestorage.AuthenticatedUser;
import com.github.rahulstech.filestorage.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

/**
 * Filter to validate symmetric JWT tokens and set security authentication context.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {


    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final UserService userSrvc;

    /**
     * Processes every incoming HTTP request to establish authentication from a JWT.
     *
     * <p>This filter does NOT enforce authorization or reject requests without a JWT.
     * Its sole responsibility is to inspect the {@code Authorization} header and,
     * if a Bearer token is present, validate it and populate the Spring Security
     * {@code SecurityContext} with an authenticated user.</p>
     *
     * <p>Flow:</p>
     * <ol>
     *   <li>Check for an {@code Authorization} header.</li>
     *   <li>If no Bearer token is present, simply continue the filter chain.</li>
     *   <li>If a Bearer token is present, verify its signature and validity.</li>
     *   <li>If verification succeeds, create an {@code Authentication} object and
     *       store it in the {@code SecurityContextHolder}.</li>
     *   <li>If verification fails, clear the security context and continue the
     *       filter chain as an anonymous request.</li>
     * </ol>
     *
     * <p>Whether the request is ultimately allowed or rejected is determined later
     * by Spring Security's authorization rules configured in the
     * {@code SecurityFilterChain} (e.g. {@code permitAll()} or
     * {@code authenticated()}).</p>
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // check first if the request is already authenticated
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.debug("user already authenticated");
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // Check if authorization header exists and starts with Bearer prefix
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("Authorization header missing");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            // Verify symmetric JWT signature
            AuthenticatedUser user = userSrvc.verifyToken(token);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    user, null, Collections.emptyList()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        } catch (Exception e) {
            log.debug("invalid token {}", e.getMessage());

            // On validation failure, ensure context is cleared
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
