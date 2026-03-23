package com.example.library.controller;

import com.example.library.document.Author;
import com.example.library.document.Book;
import com.example.library.dto.AuthorInput;
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
public class AuthorController {

    private final AuthorService authorService;
    private final BookService bookService;

    @QueryMapping
    public Flux<Author> authors(@Argument String query) {
        return authorService.search(query);
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
     * Batched resolver for {@code Author.books}: one books query per GraphQL request.
     */
    @BatchMapping(typeName = "Author", field = "books")
    public Mono<Map<Author, List<Book>>> books(List<Author> authors) {
        if (authors == null || authors.isEmpty()) {
            return Mono.just(Map.of());
        }
        var ids = authors.stream()
                .map(Author::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return bookService.findByAuthorIdsGrouped(ids)
                .map(grouped -> {
                    Map<Author, List<Book>> out = HashMap.newHashMap(authors.size());
                    for (Author author : authors) {
                        String id = author.getId();
                        out.put(author, grouped.getOrDefault(id, List.of()));
                    }
                    return out;
                });
    }

    /**
     * GraphQL subscription — streams newly created authors over WebSocket.
     * Returns a Flux; Spring for GraphQL maps each emission to a subscription event.
     */
    @SubscriptionMapping
    public Flux<Author> authorAdded() {
        return authorService.getAuthorAddedStream();
    }

    /** GraphQL subscription — streams the ID of each deleted author over WebSocket. */
    @SubscriptionMapping
    public Flux<String> authorDeleted() {
        return authorService.getAuthorDeletedStream();
    }
}
