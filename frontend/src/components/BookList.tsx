import type { GetBooksQuery } from "../gql/graphql";
import { BookCard } from "./BookCard";

type Book = GetBooksQuery["books"][number];

interface BookListProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export function BookList({ books, onSelectBook }: BookListProps) {
  if (books.length === 0) {
    return <p className="empty-state">No books found. Add one!</p>;
  }

  return (
    <div className="book-grid">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onSelect={onSelectBook} />
      ))}
    </div>
  );
}
