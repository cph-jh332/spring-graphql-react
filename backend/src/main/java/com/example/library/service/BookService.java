package com.example.library.service;

import com.example.library.document.Book;
import com.example.library.document.BorrowRecord;
import com.example.library.document.User;
import com.example.library.dto.BookInput;
import com.example.library.repository.AuthorRepository;
import com.example.library.repository.BookRepository;
import com.example.library.repository.UserRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final UserRepository userRepository;

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

    public BookService(BookRepository bookRepository, AuthorRepository authorRepository, UserRepository userRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.userRepository = userRepository;
    }

    public Flux<Book> findAll() {
        return bookRepository.findAll();
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

    /**
     * Loads books for many author ids in one query, grouped by {@link Book#getAuthorId()}.
     * Used by GraphQL {@code @BatchMapping} for {@code Author.books}.
     */
    public Mono<Map<String, List<Book>>> findByAuthorIdsGrouped(Collection<String> authorIds) {
        if (authorIds == null || authorIds.isEmpty()) {
            return Mono.just(Map.of());
        }
        var distinct = authorIds.stream().distinct().toList();
        return bookRepository.findByAuthorIdIn(distinct)
                .collectList()
                .map(list -> {
                    Map<String, List<Book>> grouped = list.stream()
                            .collect(Collectors.groupingBy(Book::getAuthorId));
                    Map<String, List<Book>> result = new HashMap<>();
                    for (String id : distinct) {
                        result.put(id, List.copyOf(grouped.getOrDefault(id, List.of())));
                    }
                    return result;
                });
    }

    public Mono<Book> create(BookInput input) {
        return authorRepository.findById(input.authorId())
                .switchIfEmpty(Mono.error(new RuntimeException("Author not found: " + input.authorId())))
                .flatMap(author -> {
                    Book book = Book.builder()
                            .title(input.title())
                            .year(input.year())
                            .authorId(input.authorId())
                            .totalCopies(input.totalCopies())
                            .borrowedCount(0)
                            .build();
                    return bookRepository.save(book);
                })
                .doOnNext(book -> bookSink.tryEmitNext(book));
    }

    /**
     * Updates title, year, author and totalCopies of an existing book.
     * Refuses to lower totalCopies below the current borrowedCount.
     */
    public Mono<Book> update(String id, BookInput input) {
        return bookRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Book not found: " + id)))
                .flatMap(book -> {
                    if (input.totalCopies() < book.getBorrowedCount()) {
                        return Mono.error(new IllegalArgumentException(
                                "Cannot set totalCopies to " + input.totalCopies()
                                + " — " + book.getBorrowedCount() + " copies are currently borrowed."));
                    }
                    return authorRepository.findById(input.authorId())
                            .switchIfEmpty(Mono.error(new RuntimeException("Author not found: " + input.authorId())))
                            .flatMap(author -> {
                                book.setTitle(input.title());
                                book.setYear(input.year());
                                book.setAuthorId(input.authorId());
                                book.setTotalCopies(input.totalCopies());
                                return bookRepository.save(book);
                            });
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
                });
    }

    /**
     * Borrows a book for the given user. Requires at least one available copy
     * and that the user has not already borrowed this book.
     */
    public Mono<Book> borrow(String bookId, String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found: " + username)))
                .flatMap(user -> bookRepository.findById(bookId)
                        .switchIfEmpty(Mono.error(new RuntimeException("Book not found: " + bookId)))
                        .flatMap(book -> {
                            boolean alreadyBorrowed = user.getBorrowedRecords().stream()
                                    .anyMatch(r -> r.bookId().equals(bookId));
                            if (alreadyBorrowed) {
                                return Mono.error(new IllegalStateException("You have already borrowed this book."));
                            }
                            int available = book.getTotalCopies() - book.getBorrowedCount();
                            if (available <= 0) {
                                return Mono.error(new IllegalStateException("No copies available for borrowing."));
                            }
                            book.setBorrowedCount(book.getBorrowedCount() + 1);
                            List<BorrowRecord> updated = new ArrayList<>(user.getBorrowedRecords());
                            updated.add(new BorrowRecord(bookId, Instant.now()));
                            user.setBorrowedRecords(updated);
                            return bookRepository.save(book)
                                    .flatMap(savedBook -> userRepository.save(user).thenReturn(savedBook));
                        }));
    }

    /**
     * Returns a previously borrowed book for the given user.
     */
    public Mono<Book> returnBook(String bookId, String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found: " + username)))
                .flatMap(user -> bookRepository.findById(bookId)
                        .switchIfEmpty(Mono.error(new RuntimeException("Book not found: " + bookId)))
                        .flatMap(book -> {
                            boolean hasBorrowed = user.getBorrowedRecords().stream()
                                    .anyMatch(r -> r.bookId().equals(bookId));
                            if (!hasBorrowed) {
                                return Mono.error(new IllegalStateException("You have not borrowed this book."));
                            }
                            book.setBorrowedCount(Math.max(0, book.getBorrowedCount() - 1));
                            List<BorrowRecord> updated = user.getBorrowedRecords().stream()
                                    .filter(r -> !r.bookId().equals(bookId))
                                    .collect(Collectors.toCollection(ArrayList::new));
                            user.setBorrowedRecords(updated);
                            return bookRepository.save(book)
                                    .flatMap(savedBook -> userRepository.save(user).thenReturn(savedBook));
                        }));
    }

    /** Computed field: available = totalCopies - borrowedCount. */
    public int availableCount(Book book) {
        return book.getTotalCopies() - book.getBorrowedCount();
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
