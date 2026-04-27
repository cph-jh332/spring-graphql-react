import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { gqlClient } from "../api/client";
import { DELETE_AUTHOR } from "../api/mutations";
import { GET_AUTHORS } from "../api/queries";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import { Role } from "../gql/graphql";
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
	const { isAuthenticated, user } = useAuth();
	const isLibrarian = user?.roles.includes(Role.Librarian);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchInput.trim() || undefined);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKeys.authors.list(debouncedQuery),
		queryFn: () => gqlClient.request(GET_AUTHORS, { query: debouncedQuery }),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => gqlClient.request(DELETE_AUTHOR, { id }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.authors.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
		},
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-[28px] font-semibold tracking-tight">Authors</h1>
				{isAuthenticated && isLibrarian && (
					<Button type="button" onClick={() => setShowForm(true)}>
						+ Add Author
					</Button>
				)}
			</div>

			<div className="mb-5">
				<Input
					type="search"
					className="max-w-[480px]"
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

			{isLoading && (
				<p className="text-sm text-muted-foreground">Loading authors...</p>
			)}
			{isError && (
				<p className="text-sm text-destructive">
					Failed to load authors:{" "}
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			)}

			{data && (
				<div className="flex flex-col gap-4">
					{debouncedQuery && (
						<p className="text-xs text-muted-foreground">
							{data.authors.length} result
							{data.authors.length !== 1 ? "s" : ""} for &ldquo;
							{debouncedQuery}&rdquo;
						</p>
					)}
					{data.authors.length === 0 && (
						<p className="text-sm text-muted-foreground py-12 text-center">
							{debouncedQuery
								? "No authors match your search."
								: "No authors found. Add one!"}
						</p>
					)}
					{data.authors.map((author) => (
						<Card key={author.id} className="hover:border-primary">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">{author.name}</CardTitle>
									{isAuthenticated && isLibrarian && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive border border-transparent"
											onClick={() => deleteMutation.mutate(author.id)}
											disabled={deleteMutation.isPending}
											aria-label={`Delete ${author.name}`}
										>
											<X className="h-3 w-3" />
										</Button>
									)}
								</div>
								<p className="text-sm text-muted-foreground">
									{author.books.length} book
									{author.books.length !== 1 ? "s" : ""}
								</p>
							</CardHeader>
							{author.books.length > 0 && (
								<CardContent>
									<ul className="flex flex-col gap-1 text-sm text-foreground pl-0 list-none m-0">
										{author.books.map((book) => (
											<li key={book.id} className="flex items-center gap-2">
												{book.title}
												<Badge variant="outline">{book.year}</Badge>
											</li>
										))}
									</ul>
								</CardContent>
							)}
						</Card>
					))}
				</div>
			)}

			{showForm && <AddAuthorForm onClose={() => setShowForm(false)} />}
		</div>
	);
}
