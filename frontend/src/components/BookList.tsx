import type { GetBooksQuery } from "../gql/graphql";
import { BookCard } from "./BookCard";

type Book = GetBooksQuery["books"][number];

interface BookListProps {
	books: Book[];
	onSelectBook: (book: Book) => void;
}

export function BookList({ books, onSelectBook }: BookListProps) {
	if (books.length === 0) {
		return (
			<p className="text-sm text-muted-foreground py-12 text-center">
				No books found. Add one!
			</p>
		);
	}

	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
			{books.map((book) => (
				<BookCard key={book.id} book={book} onSelect={onSelectBook} />
			))}
		</div>
	);
}
