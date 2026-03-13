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

    public BookService(BookRepository bookRepository, AuthorRepository authorRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
    }

    public Flux<Book> findAll() {
        return bookRepository.findAll()
                .doOnNext(b -> log.debug("Found book: {}", b.getTitle()));
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
                .thenReturn(true)
                .onErrorReturn(false);
    }

    /**
     * Returns a cold Flux over the hot sink — each subscriber receives all events
     * emitted after they subscribe.
     */
    public Flux<Book> getBookAddedStream() {
        return bookSink.asFlux();
    }
}
