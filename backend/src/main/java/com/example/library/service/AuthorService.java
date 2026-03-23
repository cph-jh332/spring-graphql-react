package com.example.library.service;

import com.example.library.document.Author;
import com.example.library.dto.AuthorInput;
import com.example.library.repository.AuthorRepository;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;

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

    /**
     * Returns authors whose name contains {@code query} (case-insensitive) OR who
     * have written a book whose title contains {@code query}. Results are deduplicated
     * by author id. Falls back to {@link #findAll()} when {@code query} is null or blank.
     */
    public Flux<Author> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }
        Flux<Author> byName = authorRepository.findByNameContainingIgnoreCase(query);

        // Find author ids from books whose title matches, then look up those authors
        Flux<Author> byBookTitle = bookRepository.findByTitleContainingIgnoreCase(query)
                .map(book -> book.getAuthorId())
                .distinct()
                .collectList()
                .flatMapMany(ids -> ids.isEmpty() ? Flux.empty() : authorRepository.findByIdIn(ids));

        return Flux.merge(byName, byBookTitle)
                .distinct(Author::getId);
    }

    public Mono<Author> findById(String id) {
        return authorRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Author not found: " + id)));
    }

    /**
     * Loads many authors by id in one query. Used by GraphQL {@code @BatchMapping} for {@code Book.author}.
     */
    public Mono<Map<String, Author>> findByIdsMapped(Collection<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Mono.just(Map.of());
        }
        var distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Mono.just(Map.of());
        }
        return authorRepository.findByIdIn(distinct).collectMap(Author::getId);
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
