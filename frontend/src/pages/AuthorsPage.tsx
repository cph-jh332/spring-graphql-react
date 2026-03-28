import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { gqlClient } from "../api/client";
import { DELETE_AUTHOR } from "../api/mutations";
import { GET_AUTHORS } from "../api/queries";
import { AddAuthorForm } from "../components/AddAuthorForm";
import { AuthorLiveFeed } from "../components/AuthorLiveFeed";
import type { OnAuthorAddedSubscription } from "../gql/graphql";

type NewAuthor = OnAuthorAddedSubscription["authorAdded"];

interface AuthorsPageProps {
	newAuthors: NewAuthor[];
	feedError: string | null;
	clearFeed: () => void;
}

export function AuthorsPage({
	newAuthors,
	feedError,
	clearFeed,
}: AuthorsPageProps) {
	const queryClient = useQueryClient();
	const [showForm, setShowForm] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState<string | undefined>(
		undefined,
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchInput.trim() || undefined);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["authors", debouncedQuery],
		queryFn: () => gqlClient.request(GET_AUTHORS, { query: debouncedQuery }),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => gqlClient.request(DELETE_AUTHOR, { id }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authors"] });
			queryClient.invalidateQueries({ queryKey: ["books"] });
		},
	});

	return (
		<div className="page">
			<div className="page-header">
				<h1>Authors</h1>
				<button
					className="btn btn-primary"
					type="button"
					onClick={() => setShowForm(true)}
				>
					+ Add Author
				</button>
			</div>

			<div className="search-bar">
				<input
					type="search"
					className="search-input"
					placeholder="Search by author name or book title..."
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
				/>
			</div>

			<AuthorLiveFeed
				newAuthors={newAuthors}
				error={feedError}
				clearFeed={clearFeed}
			/>

			{isLoading && <p className="loading">Loading authors...</p>}
			{isError && (
				<p className="error-text">
					Failed to load authors:{" "}
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			)}

			{data && (
				<div className="author-list">
					{debouncedQuery && (
						<p className="search-result-count">
							{data.authors.length} result{data.authors.length !== 1 ? "s" : ""}{" "}
							for &ldquo;{debouncedQuery}&rdquo;
						</p>
					)}
					{data.authors.length === 0 && (
						<p className="empty-state">
							{debouncedQuery
								? "No authors match your search."
								: "No authors found. Add one!"}
						</p>
					)}
					{data.authors.map((author) => (
						<div key={author.id} className="author-card">
							<div className="author-card-header">
								<h2 className="author-name">{author.name}</h2>
								<button
									className="btn-delete"
									type="button"
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
