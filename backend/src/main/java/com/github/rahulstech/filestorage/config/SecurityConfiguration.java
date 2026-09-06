package com.github.rahulstech.filestorage.config;

import com.github.rahulstech.filestorage.dto.ErrorResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

/**
 * Spring Security Configuration defining auth rules and filter chains.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CorsConfigurationSource corsConfigurationSource,
            AuthenticationEntryPoint authenticationEntryPoint,
            AccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // using JWT based user authentication
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .csrf(AbstractHttpConfigurer::disable) // since cookie / session based authenticate is not used, therefore csrf is disabled

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )

                // basic or form based authentication is not required therefore replacing it completely with JWTAuthenticationFilter
                .addFilterAt(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Register custom entry point and access denied handlers to return
                // structured JSON error responses rather than Spring's default HTML pages.
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )

                // disable spring security default authentication
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
        ;

        return http.build();
    }

    /**
     * Handles unauthenticated requests (HTTP 401).
     * Since the security filters run before DispatcherServlet, we manually serialize
     * the ErrorResponse.SimpleError to the response body.
     */
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse.SimpleError error = new ErrorResponse.SimpleError(authException.getMessage());

            response.getWriter().write(objectMapper.writeValueAsString(error));
        };
    }

    /**
     * Handles authenticated but unauthorized requests (HTTP 403).
     * Manually writes a structured ErrorResponse.SimpleError JSON response.
     */
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse.SimpleError error = new ErrorResponse.SimpleError("Access Denied");
            response.getWriter().write(objectMapper.writeValueAsString(error));
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${filestorageservice.cors.allow_origins}") List<String> corsAllowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(corsAllowedOrigins);
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration); // register for all paths

        return source;
    }
}
