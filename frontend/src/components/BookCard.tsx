import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../api/client";
import { DELETE_BOOK } from "../api/mutations";
import type { Book } from "../api/types";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ deleteBook: boolean }>(DELETE_BOOK, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });

  return (
    <div className="book-card">
      <div className="book-card-header">
        <h3 className="book-title">{book.title}</h3>
        <button
          className="btn-delete"
          onClick={() => deleteMutation.mutate(book.id)}
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
