package com.example.library.controller;

import com.example.library.repository.UserRepository;
import com.example.library.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.server.reactive.ServerHttpResponse;
import reactor.core.publisher.Mono;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    // ── DTOs ────────────────────────────────────────────────────────────────

    public record LoginRequest(String username, String password) {}
    public record AuthResponse(String username) {}

    // ── Endpoints ────────────────────────────────────────────────────────────

    /**
     * Validates credentials and, on success, sets an HttpOnly {@code access_token}
     * cookie containing a signed JWT. Returns the authenticated username.
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(
            @RequestBody LoginRequest req,
            ServerHttpResponse response
    ) {
        return userRepository.findByUsername(req.username())
                .filter(user -> passwordEncoder.matches(req.password(), user.getPasswordHash()))
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername());
                    response.addCookie(buildCookie(token, expirationMs));
                    return ResponseEntity.ok(new AuthResponse(user.getUsername()));
                })
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).<AuthResponse>build());
    }

    /**
     * Clears the {@code access_token} cookie (Max-Age=0).
     */
    @PostMapping("/logout")
    public Mono<ResponseEntity<Void>> logout(ServerHttpResponse response) {
        response.addCookie(buildCookie("", 0));
        return Mono.just(ResponseEntity.ok().<Void>build());
    }

    /**
     * Returns the current user's username if authenticated, 401 otherwise.
     * The frontend calls this on startup to restore session state.
     */
    @GetMapping("/me")
    public Mono<ResponseEntity<AuthResponse>> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return Mono.just(ResponseEntity.ok(new AuthResponse(authentication.getName())));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ResponseCookie buildCookie(String value, long maxAgeMs) {
        return ResponseCookie.from("access_token", value)
                .httpOnly(true)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMillis(maxAgeMs))
                .build();
    }
}
