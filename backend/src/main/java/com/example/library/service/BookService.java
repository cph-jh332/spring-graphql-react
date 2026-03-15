package com.example.library.service;

import com.example.library.document.Book;
import com.example.library.dto.BookInput;
import com.example.library.repository.AuthorRepository;
import com.example.library.repository.BookRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

@Slf4j
@Service
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;

    /**
     * Hot sink that broadcasts newly created books to all active GraphQL subscriptions.
     *
     * multicast().directBestEffort() creates a multicast hot publisher that:
     * - supports any number of concurrent subscribers independently
     * - does NOT auto-cancel when a subscriber leaves
     * - does NOT replay past events to late subscribers
     */
    private final Sinks.Many<Book> bookSink = Sinks.many().multicast().directBestEffort();

    /** Hot sink that broadcasts the ID of each deleted book. */
    private final Sinks.Many<String> bookDeletedSink = Sinks.many().multicast().directBestEffort();

    public BookService(BookRepository bookRepository, AuthorRepository authorRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
    }

    public Flux<Book> findAll() {
        return bookRepository.findAll()
                .doOnNext(b -> log.debug("Found book: {}", b.getTitle()));
    }

    /**
     * Returns books whose title contains {@code query} (case-insensitive) OR whose
     * author's name contains {@code query}. Results are deduplicated by book id.
     * Falls back to {@link #findAll()} when {@code query} is null or blank.
     */
    public Flux<Book> search(String query) {
        if (query == null || query.isBlank()) {
            return findAll();
        }
        Flux<Book> byTitle = bookRepository.findByTitleContainingIgnoreCase(query);

        // Find author ids matching the query, then look up their books
        Flux<Book> byAuthorName = authorRepository.findByNameContainingIgnoreCase(query)
                .map(author -> author.getId())
                .collectList()
                .flatMapMany(ids -> ids.isEmpty() ? Flux.empty() : bookRepository.findByAuthorIdIn(ids));

        return Flux.merge(byTitle, byAuthorName)
                .distinct(Book::getId);
    }

    public Mono<Book> findById(String id) {
        return bookRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Book not found: " + id)));
    }

    public Flux<Book> findByAuthorId(String authorId) {
        return bookRepository.findByAuthorId(authorId);
    }

    public Mono<Book> create(BookInput input) {
        return authorRepository.findById(input.authorId())
                .switchIfEmpty(Mono.error(new RuntimeException("Author not found: " + input.authorId())))
                .flatMap(author -> {
                    Book book = Book.builder()
                            .title(input.title())
                            .year(input.year())
                            .authorId(input.authorId())
                            .build();
                    return bookRepository.save(book);
                })
                .doOnNext(book -> {
                    Sinks.EmitResult result = bookSink.tryEmitNext(book);
                    log.debug("Created book: {} — emit result: {}", book.getId(), result);
                });
    }

    public Mono<Boolean> delete(String id) {
        return bookRepository.deleteById(id)
                .doOnSuccess(v -> bookDeletedSink.tryEmitNext(id))
                .thenReturn(true)
                .onErrorReturn(false);
    }

    /**
     * Sets (or clears) the cover image path for a book.
     *
     * @param id        the book id
     * @param imagePath relative URL path to the stored image, or {@code null} to remove it
     * @return the updated Book
     */
    public Mono<Book> updateCoverImage(String id, String imagePath) {
        return bookRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Book not found: " + id)))
                .flatMap(book -> {
                    book.setCoverImage(imagePath);
                    return bookRepository.save(book);
                })
                .doOnNext(book -> log.debug("Updated cover for book {}: {}", id, imagePath));
    }

    /**
     * Returns a cold Flux over the hot sink — each subscriber receives all events
     * emitted after they subscribe.
     */
    public Flux<Book> getBookAddedStream() {
        return bookSink.asFlux();
    }

    public Flux<String> getBookDeletedStream() {
        return bookDeletedSink.asFlux();
    }
}
