import type { Book } from "../api/types";
import { BookCard } from "./BookCard";

interface BookListProps {
  books: Book[];
}

export function BookList({ books }: BookListProps) {
  if (books.length === 0) {
    return <p className="empty-state">No books found. Add one!</p>;
  }

  return (
    <div className="book-grid">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
