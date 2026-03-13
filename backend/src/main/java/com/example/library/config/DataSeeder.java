package com.example.library.config;

import com.example.library.document.Author;
import com.example.library.document.Book;
import com.example.library.repository.AuthorRepository;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedData()
                .doOnComplete(() -> log.info("Database seeding complete."))
                .doOnError(e -> log.error("Seeding failed", e))
                .subscribe();
    }

    private Flux<Book> seedData() {
        return authorRepository.count()
                .flatMapMany(count -> {
                    if (count > 0) {
                        log.info("Database already contains data, skipping seed.");
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
                            });
                });
    }
}
