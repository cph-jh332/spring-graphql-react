package com.example.library.config;

import com.example.library.document.Author;
import com.example.library.document.Book;
import com.example.library.document.User;
import com.example.library.repository.AuthorRepository;
import com.example.library.repository.BookRepository;
import com.example.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import net.logstash.logback.marker.Markers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedUsers().thenMany(seedBooks()).subscribe();
    }

    // ── User seeding ──────────────────────────────────────────────────────────

    private reactor.core.publisher.Mono<Void> seedUsers() {
        return userRepository.count()
                .flatMap(count -> {
                    if (count > 0) {
                        return reactor.core.publisher.Mono.empty();
                    }
                    User admin = User.builder()
                            .username("admin")
                            .passwordHash(passwordEncoder.encode("admin123"))
                            .build();
                    return userRepository.save(admin)
                            .doOnSuccess(u -> log.info(
                                    Markers.append("event", "seed.user.created")
                                            .and(Markers.append("username", u.getUsername())),
                                    "startup"))
                            .then();
                });
    }

    // ── Book / author seeding ─────────────────────────────────────────────────

    private Flux<Book> seedBooks() {
        return authorRepository.count()
                .flatMapMany(count -> {
                    if (count > 0) {
                        log.info(Markers.append("event", "seed.skipped"), "startup");
                        return Flux.empty();
                    }
                    return authorRepository.saveAll(List.of(
                                    Author.builder().name("Frank Herbert").build(),
                                    Author.builder().name("Ursula K. Le Guin").build(),
                                    Author.builder().name("Isaac Asimov").build()
                            ))
                            .collectList()
                            .flatMapMany(authors -> {
                                Author herbert = authors.get(0);
                                Author leguin = authors.get(1);
                                Author asimov = authors.get(2);

                                return bookRepository.saveAll(List.of(
                                        Book.builder().title("Dune").year(1965).authorId(herbert.getId()).build(),
                                        Book.builder().title("Dune Messiah").year(1969).authorId(herbert.getId()).build(),
                                        Book.builder().title("The Left Hand of Darkness").year(1969).authorId(leguin.getId()).build(),
                                        Book.builder().title("The Dispossessed").year(1974).authorId(leguin.getId()).build(),
                                        Book.builder().title("Foundation").year(1951).authorId(asimov.getId()).build(),
                                        Book.builder().title("I, Robot").year(1950).authorId(asimov.getId()).build()
                                ));
                            })
                            .doOnComplete(() -> log.info(Markers.append("event", "seed.complete"), "startup"))
                            .doOnError(e -> log.error(
                                    Markers.append("event", "seed.failed")
                                            .and(Markers.append("error.message", e.getMessage()))
                                            .and(Markers.append("error.type", e.getClass().getSimpleName())),
                                    "startup", e));
                });
    }
}
