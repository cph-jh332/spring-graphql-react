package com.example.library.controller;

import com.example.library.document.BorrowRecord;
import com.example.library.document.Role;
import com.example.library.document.User;
import com.example.library.security.JwtUtil;
import com.example.library.service.UserService;
import graphql.schema.DataFetchingEnvironment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

/**
 * GraphQL controller for authentication and user-management operations.
 *
 * Cookie handling: Spring GraphQL does not support direct ServerWebExchange
 * injection in handler methods. We retrieve the exchange from the GraphQLContext,
 * where Spring GraphQL (WebFlux transport) stores it under ServerWebExchange.class.
 *
 * Auth context: Spring GraphQL + WebFlux automatically propagates the reactive
 * security context (populated by JwtAuthFilter) into GraphQL execution.
 *
 * Non-blocking: all bcrypt work runs on Schedulers.boundedElastic() inside
 * UserService; the controller stays fully reactive.
 */
@Controller
@RequiredArgsConstructor
public class UserGraphQlController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record LoginInput(String username, String password) {}
    public record RegisterInput(String username, String password, Role role) {}
    public record UpdateUserInput(String username, Role role, String newPassword) {}
    public record AuthPayload(String username, List<Role> roles, List<BorrowRecord> borrowedRecords) {}
    public record UserDto(String username, List<Role> roles, List<BorrowRecord> borrowedRecords) {}

    // ── Auth queries ──────────────────────────────────────────────────────────

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Mono<AuthPayload> me(Authentication authentication) {
        return userService.findByUsername(authentication.getName())
                .map(u -> new AuthPayload(u.getUsername(), u.getRoles(), u.getBorrowedRecords()));
    }

    // ── User management queries (LIBRARIAN only) ──────────────────────────────

    @QueryMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public Flux<UserDto> users() {
        return userService.listAll()
                .map(u -> new UserDto(u.getUsername(), u.getRoles(), u.getBorrowedRecords()));
    }

    // ── Auth mutations ────────────────────────────────────────────────────────

    @MutationMapping
    public Mono<AuthPayload> login(@Argument LoginInput input, DataFetchingEnvironment env) {
        return userService.authenticate(input.username(), input.password())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Invalid credentials")))
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername(), user.getRoles());
                    getExchange(env).getResponse().addCookie(buildCookie(token, expirationMs));
                    return new AuthPayload(user.getUsername(), user.getRoles(), user.getBorrowedRecords());
                });
    }

    @MutationMapping
    public Mono<Boolean> logout(DataFetchingEnvironment env) {
        getExchange(env).getResponse().addCookie(buildCookie("", 0));
        return Mono.just(true);
    }

    /**
     * Registration is open to anyone. By default, new users receive MEMBER role.
     * Assigning LIBRARIAN role requires the caller to be authenticated as LIBRARIAN.
     */
    @MutationMapping
    public Mono<AuthPayload> register(
            @Argument RegisterInput input,
            Authentication authentication,
            DataFetchingEnvironment env
    ) {
        Role requestedRole = input.role() == null ? Role.MEMBER : input.role();

        if (requestedRole == Role.LIBRARIAN) {
            boolean isLibrarian = authentication != null &&
                    authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_LIBRARIAN"));
            if (!isLibrarian) {
                return Mono.error(new SecurityException("Only a librarian can assign LIBRARIAN role"));
            }
        }

        return userService.register(input.username(), input.password(), requestedRole)
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername(), user.getRoles());
                    getExchange(env).getResponse().addCookie(buildCookie(token, expirationMs));
                    return new AuthPayload(user.getUsername(), user.getRoles(), user.getBorrowedRecords());
                });
    }

    // ── User management mutations (LIBRARIAN only) ────────────────────────────

    @MutationMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public Mono<Boolean> deleteUser(@Argument String username) {
        return userService.deleteUser(username).thenReturn(true);
    }

    @MutationMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public Mono<UserDto> updateUser(@Argument UpdateUserInput input) {
        return userService.updateUser(input.username(), input.role(), input.newPassword())
                .map(u -> new UserDto(u.getUsername(), u.getRoles(), u.getBorrowedRecords()));
    }

    /**
     * Creates a user without touching the caller's session cookie.
     * Only librarians can call this. Used by the admin Users page.
     */
    @MutationMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public Mono<UserDto> createUser(@Argument RegisterInput input) {
        Role role = input.role() == null ? Role.MEMBER : input.role();
        return userService.register(input.username(), input.password(), role)
                .map(u -> new UserDto(u.getUsername(), u.getRoles(), u.getBorrowedRecords()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ServerWebExchange getExchange(DataFetchingEnvironment env) {
        return env.getGraphQlContext().get(ServerWebExchange.class);
    }

    private ResponseCookie buildCookie(String value, long maxAgeMs) {
        return ResponseCookie.from("access_token", value)
                .httpOnly(true)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMillis(maxAgeMs))
                .build();
    }
}
