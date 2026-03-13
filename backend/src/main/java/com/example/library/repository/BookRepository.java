package com.example.library.repository;

import com.example.library.document.Book;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface BookRepository extends ReactiveMongoRepository<Book, String> {

    Flux<Book> findByAuthorId(String authorId);
}
