import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../api/client";
import { DELETE_BOOK } from "../api/mutations";
import type { GetBooksQuery } from "../gql/graphql";

type Book = GetBooksQuery["books"][number];

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      gqlClient.request(DELETE_BOOK, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });

  return (
    <div
      className="book-card"
      onClick={() => onSelect(book)}
      style={{ cursor: "pointer" }}
    >
      <div className="book-cover-thumb">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            className="book-cover-img"
          />
        ) : (
          <div className="book-cover-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>
      <div className="book-card-header">
        <h3 className="book-title">{book.title}</h3>
        <button
          className="btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteMutation.mutate(book.id);
          }}
          disabled={deleteMutation.isPending}
          aria-label={`Delete ${book.title}`}
        >
          {deleteMutation.isPending ? "..." : "✕"}
        </button>
      </div>
      <p className="book-author">{book.author.name}</p>
      <span className="book-year">{book.year}</span>
    </div>
  );
}
