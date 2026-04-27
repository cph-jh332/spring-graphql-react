package com.example.library.service;

import com.example.library.document.Role;
import com.example.library.document.User;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Register a new user. BCrypt hashing is CPU-bound, so it runs on the
     * boundedElastic scheduler to avoid blocking event-loop threads.
     */
    public Mono<User> register(String username, String password, Role role) {
        return Mono.fromCallable(() -> passwordEncoder.encode(password))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(hash -> {
                    User user = User.builder()
                            .username(username)
                            .passwordHash(hash)
                            .roles(List.of(role == null ? Role.MEMBER : role))
                            .build();
                    return userRepository.save(user);
                });
    }

    /**
     * Validate credentials. Password check is CPU-bound — runs on boundedElastic.
     * Returns empty Mono if credentials are invalid.
     */
    public Mono<User> authenticate(String username, String rawPassword) {
        return userRepository.findByUsername(username)
                .flatMap(user -> Mono.fromCallable(
                        () -> passwordEncoder.matches(rawPassword, user.getPasswordHash()))
                        .subscribeOn(Schedulers.boundedElastic())
                        .filter(Boolean::booleanValue)
                        .map(ok -> user));
    }

    public Mono<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /** List all users — for the librarian admin page. */
    public Flux<User> listAll() {
        return userRepository.findAll();
    }

    /**
     * Update a user's role and/or password.
     * If {@code newPassword} is null/blank the existing hash is preserved.
     * Password hashing runs on boundedElastic.
     */
    public Mono<User> updateUser(String username, Role role, String newPassword) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + username)))
                .flatMap(user -> {
                    if (role != null) {
                        user.setRoles(List.of(role));
                    }
                    if (newPassword != null && !newPassword.isBlank()) {
                        return Mono.fromCallable(() -> passwordEncoder.encode(newPassword))
                                .subscribeOn(Schedulers.boundedElastic())
                                .flatMap(hash -> {
                                    user.setPasswordHash(hash);
                                    return userRepository.save(user);
                                });
                    }
                    return userRepository.save(user);
                });
    }

    /** Delete a user by username. */
    public Mono<Void> deleteUser(String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + username)))
                .flatMap(user -> userRepository.deleteById(user.getId()));
    }
}
