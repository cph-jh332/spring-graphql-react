package com.example.library.repository;

import com.example.library.document.Author;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthorRepository extends ReactiveMongoRepository<Author, String> {
}
