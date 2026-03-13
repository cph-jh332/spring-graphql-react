package com.example.library.repository;

import com.example.library.document.Author;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface AuthorRepository extends ReactiveMongoRepository<Author, String> {

    Flux<Author> findByNameContainingIgnoreCase(String name);

    Flux<Author> findByIdIn(Iterable<String> ids);
}
