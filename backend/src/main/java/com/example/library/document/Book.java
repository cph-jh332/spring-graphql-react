package com.example.library.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "books")
public class Book {

    @Id
    private String id;

    private String title;

    private int year;

    private String authorId;

    /** Relative URL path to the uploaded cover image, e.g. /uploads/books/abc123.jpg */
    private String coverImage;

    /** Total number of physical copies owned by the library. */
    private int totalCopies;

    /** Number of copies currently borrowed (not yet returned). */
    private int borrowedCount;
}
