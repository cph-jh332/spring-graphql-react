package com.example.library.controller;

import com.example.library.document.Author;
import com.example.library.document.Book;
import com.example.library.dto.BookInput;
import com.example.library.service.AuthorService;
import com.example.library.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Controller
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final AuthorService authorService;

    @QueryMapping
    public Flux<Book> books() {
        return bookService.findAll();
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
     * Resolves the `author` field on Book type.
     * Called per Book instance — fetches the Author by the stored authorId.
     */
    @SchemaMapping(typeName = "Book", field = "author")
    public Mono<Author> author(Book book) {
        return authorService.findById(book.getAuthorId());
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
