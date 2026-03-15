import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { gqlClient } from "../api/client";
import { GET_BOOKS } from "../api/queries";
import type { GetBooksQuery } from "../gql/graphql";
import { AddBookForm } from "../components/AddBookForm";
import { BookDetailModal } from "../components/BookDetailModal";
import { BookList } from "../components/BookList";
import { LiveFeed } from "../components/LiveFeed";

type Book = GetBooksQuery["books"][number];

interface BooksPageProps {
  newBooks: Book[];
  feedError: string | null;
  clearFeed: () => void;
}

export function BooksPage({ newBooks, feedError, clearFeed }: BooksPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState<string | undefined>(undefined);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim() || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["books", debouncedQuery],
    queryFn: () => gqlClient.request(GET_BOOKS, { query: debouncedQuery }),
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Books</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Book
        </button>
      </div>

      <div className="search-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search by title or author name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <LiveFeed newBooks={newBooks} error={feedError} clearFeed={clearFeed} />

      {isLoading && <p className="loading">Loading books...</p>}
      {isError && (
        <p className="error-text">
          Failed to load books:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}
      {data && (
        <>
          {debouncedQuery && (
            <p className="search-result-count">
              {data.books.length} result{data.books.length !== 1 ? "s" : ""} for &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}
          <BookList books={data.books} onSelectBook={setSelectedBook} />
        </>
      )}

      {showForm && <AddBookForm onClose={() => setShowForm(false)} />}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}
