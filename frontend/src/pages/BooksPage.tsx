import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { gqlClient } from "../api/client";
import { GET_BOOKS } from "../api/queries";
import type { Book } from "../api/types";
import { AddBookForm } from "../components/AddBookForm";
import { BookList } from "../components/BookList";
import { LiveFeed } from "../components/LiveFeed";

interface BooksPageProps {
  newBooks: Book[];
  feedError: string | null;
  clearFeed: () => void;
}

export function BooksPage({ newBooks, feedError, clearFeed }: BooksPageProps) {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error } = useQuery<{ books: Book[] }>({
    queryKey: ["books"],
    queryFn: () => gqlClient.request(GET_BOOKS),
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Books</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Book
        </button>
      </div>

      <LiveFeed newBooks={newBooks} error={feedError} clearFeed={clearFeed} />

      {isLoading && <p className="loading">Loading books...</p>}
      {isError && (
        <p className="error-text">
          Failed to load books:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}
      {data && <BookList books={data.books} />}

      {showForm && <AddBookForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
