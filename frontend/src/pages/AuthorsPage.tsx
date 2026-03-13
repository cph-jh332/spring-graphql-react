import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gqlClient } from "../api/client";
import { GET_AUTHORS } from "../api/queries";
import { DELETE_AUTHOR } from "../api/mutations";
import type { Author } from "../api/types";
import { AddAuthorForm } from "../components/AddAuthorForm";
import { AuthorLiveFeed } from "../components/AuthorLiveFeed";

export function AuthorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error } = useQuery<{ authors: Author[] }>({
    queryKey: ["authors"],
    queryFn: () => gqlClient.request(GET_AUTHORS),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ deleteAuthor: boolean }>(DELETE_AUTHOR, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Authors</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Author
        </button>
      </div>

      <AuthorLiveFeed />

      {isLoading && <p className="loading">Loading authors...</p>}
      {isError && (
        <p className="error-text">
          Failed to load authors:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {data && (
        <div className="author-list">
          {data.authors.length === 0 && (
            <p className="empty-state">No authors found. Add one!</p>
          )}
          {data.authors.map((author) => (
            <div key={author.id} className="author-card">
              <div className="author-card-header">
                <h2 className="author-name">{author.name}</h2>
                <button
                  className="btn-delete"
                  onClick={() => deleteMutation.mutate(author.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Delete ${author.name}`}
                >
                  {deleteMutation.isPending ? "..." : "✕"}
                </button>
              </div>
              <p className="author-book-count">
                {author.books.length} book{author.books.length !== 1 ? "s" : ""}
              </p>
              {author.books.length > 0 && (
                <ul className="author-books">
                  {author.books.map((book) => (
                    <li key={book.id}>
                      {book.title}{" "}
                      <span className="book-year">({book.year})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <AddAuthorForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
