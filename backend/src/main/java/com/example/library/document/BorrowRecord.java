package com.example.library.document;

import java.time.Instant;

/**
 * Embedded record tracking a single book loan for a user.
 *
 * @param bookId     the borrowed book's MongoDB id
 * @param borrowedAt the instant at which the book was borrowed
 */
public record BorrowRecord(String bookId, Instant borrowedAt) {}
