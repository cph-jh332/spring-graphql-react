package com.example.library.controller;

import com.example.library.document.Author;
import com.example.library.document.Book;
import com.example.library.dto.AuthorInput;
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
public class AuthorController {

    private final AuthorService authorService;
    private final BookService bookService;

    @QueryMapping
    public Flux<Author> authors() {
        return authorService.findAll();
    }

    @QueryMapping
    public Mono<Author> author(@Argument String id) {
        return authorService.findById(id);
    }

    @MutationMapping
    public Mono<Author> addAuthor(@Argument @Valid AuthorInput input) {
        return authorService.create(input);
    }

    @MutationMapping
    public Mono<Boolean> deleteAuthor(@Argument String id) {
        return authorService.delete(id);
    }

    /**
     * Resolves the `books` field on Author type.
     * Called per Author instance — BookService uses the author's id to query.
     */
    @SchemaMapping(typeName = "Author", field = "books")
    public Flux<Book> books(Author author) {
        return bookService.findByAuthorId(author.getId());
    }

    /**
     * GraphQL subscription — streams newly created authors over WebSocket.
     * Returns a Flux; Spring for GraphQL maps each emission to a subscription event.
     */
    @SubscriptionMapping
    public Flux<Author> authorAdded() {
        return authorService.getAuthorAddedStream();
    }
}
