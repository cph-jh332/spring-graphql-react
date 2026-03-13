package com.example.library.service;

import com.example.library.document.Author;
import com.example.library.dto.AuthorInput;
import com.example.library.repository.AuthorRepository;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthorService {

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;

    /**
     * Hot sink that broadcasts newly created authors to all active GraphQL subscriptions.
     *
     * multicast().directBestEffort() creates a multicast hot publisher that:
     * - supports any number of concurrent subscribers independently
     * - does NOT auto-cancel when a subscriber leaves
     * - does NOT replay past events to late subscribers
     */
    private final Sinks.Many<Author> authorSink = Sinks.many().multicast().directBestEffort();

    /** Hot sink that broadcasts the ID of each deleted author. */
    private final Sinks.Many<String> authorDeletedSink = Sinks.many().multicast().directBestEffort();

    public Flux<Author> findAll() {
        return authorRepository.findAll()
                .doOnNext(a -> log.debug("Found author: {}", a.getName()));
    }

    public Mono<Author> findById(String id) {
        return authorRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Author not found: " + id)));
    }

    public Mono<Author> create(AuthorInput input) {
        Author author = Author.builder()
                .name(input.name())
                .build();
        return authorRepository.save(author)
                .doOnNext(a -> {
                    log.debug("Created author: {}", a.getId());
                    Sinks.EmitResult result = authorSink.tryEmitNext(a);
                    log.debug("Author emit result: {}", result);
                });
    }

    public Mono<Boolean> delete(String id) {
        return bookRepository.deleteByAuthorId(id)
                .then(authorRepository.deleteById(id))
                .doOnSuccess(v -> authorDeletedSink.tryEmitNext(id))
                .thenReturn(true)
                .onErrorResume(e -> {
                    log.error("Failed to delete author {}: {}", id, e.getMessage());
                    return Mono.just(false);
                });
    }

    /**
     * Returns a cold Flux over the hot sink — each subscriber receives all events
     * emitted after they subscribe.
     */
    public Flux<Author> getAuthorAddedStream() {
        return authorSink.asFlux();
    }

    public Flux<String> getAuthorDeletedStream() {
        return authorDeletedSink.asFlux();
    }
}
