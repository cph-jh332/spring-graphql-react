package com.example.library.controller;

import com.example.library.document.Author;
import com.example.library.document.Book;
import com.example.library.dto.BookInput;
import com.example.library.service.AuthorService;
import com.example.library.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Controller
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final AuthorService authorService;

    @QueryMapping
    public Flux<Book> books(@Argument String query) {
        return bookService.search(query);
    }

    @QueryMapping
    public Mono<Book> book(@Argument String id) {
        return bookService.findById(id);
    }

    @MutationMapping
    public Mono<Book> addBook(@Argument @Valid BookInput input) {
        return bookService.create(input);
    }

    @MutationMapping
    public Mono<Boolean> deleteBook(@Argument String id) {
        return bookService.delete(id);
    }

    /**
     * Batched resolver for {@code Book.author}: one author query per GraphQL request.
     */
    @BatchMapping(typeName = "Book", field = "author")
    public Mono<Map<Book, Author>> author(List<Book> books) {
        if (books == null || books.isEmpty()) {
            return Mono.just(Map.of());
        }
        var ids = books.stream()
                .map(Book::getAuthorId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return authorService.findByIdsMapped(ids)
                .map(authorsById -> {
                    Map<Book, Author> out = HashMap.newHashMap(books.size());
                    for (Book book : books) {
                        String authorId = book.getAuthorId();
                        if (authorId == null) {
                            throw new RuntimeException("Author not found: null");
                        }
                        Author author = authorsById.get(authorId);
                        if (author == null) {
                            throw new RuntimeException("Author not found: " + authorId);
                        }
                        out.put(book, author);
                    }
                    return out;
                });
    }

    /**
     * GraphQL subscription — streams newly created books over WebSocket.
     * Returns a Flux; Spring for GraphQL maps each emission to a subscription event.
     */
    @SubscriptionMapping
    public Flux<Book> bookAdded() {
        return bookService.getBookAddedStream();
    }

    /** GraphQL subscription — streams the ID of each deleted book over WebSocket. */
    @SubscriptionMapping
    public Flux<String> bookDeleted() {
        return bookService.getBookDeletedStream();
    }
}
