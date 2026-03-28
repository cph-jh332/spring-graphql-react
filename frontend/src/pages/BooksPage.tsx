import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gqlClient } from "../api/client";
import { GET_BOOKS } from "../api/queries";
import { AddBookForm } from "../components/AddBookForm";
import { BookDetailModal } from "../components/BookDetailModal";
import { BookList } from "../components/BookList";
import { LiveFeed } from "../components/LiveFeed";
import type { GetBooksQuery } from "../gql/graphql";

type Book = GetBooksQuery["books"][number];

interface BooksPageProps {
	newBooks: Book[];
	feedError: string | null;
	clearFeed: () => void;
}

export function BooksPage({ newBooks, feedError, clearFeed }: BooksPageProps) {
	const [showForm, setShowForm] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState<string | undefined>(
		undefined,
	);
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
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-[28px] font-semibold tracking-tight">Books</h1>
				<Button type="button" onClick={() => setShowForm(true)}>
					+ Add Book
				</Button>
			</div>

			<div className="mb-5">
				<Input
					type="search"
					className="max-w-[480px]"
					placeholder="Search by title or author name..."
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
				/>
			</div>

			<LiveFeed newBooks={newBooks} error={feedError} clearFeed={clearFeed} />

			{isLoading && (
				<p className="text-sm text-muted-foreground">Loading books...</p>
			)}
			{isError && (
				<p className="text-sm text-destructive">
					Failed to load books:{" "}
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			)}
			{data && (
				<>
					{debouncedQuery && (
						<p className="text-xs text-muted-foreground mb-4">
							{data.books.length} result{data.books.length !== 1 ? "s" : ""} for
							&ldquo;{debouncedQuery}&rdquo;
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
