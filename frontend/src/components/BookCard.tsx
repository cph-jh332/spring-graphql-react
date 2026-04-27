import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { gqlClient } from "../api/client";
import { DELETE_BOOK } from "../api/mutations";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import { Role } from "../gql/graphql";
import type { GetBooksQuery } from "../gql/graphql";

type Book = GetBooksQuery["books"][number];

interface BookCardProps {
	book: Book;
	onSelect: (book: Book) => void;
}

export function BookCard({ book, onSelect }: BookCardProps) {
	const queryClient = useQueryClient();
	const { isAuthenticated, user } = useAuth();
	const isLibrarian = user?.roles.includes(Role.Librarian);

	const deleteMutation = useMutation({
		mutationFn: (id: string) => gqlClient.request(DELETE_BOOK, { id }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.authors.all });
		},
	});

	return (
		<Card
			className="flex flex-col gap-1.5 cursor-pointer hover:border-primary transition-colors"
			onClick={() => onSelect(book)}
		>
			{/* Cover thumbnail */}
			<div className="w-full aspect-[2/3] rounded-t-xl overflow-hidden bg-secondary flex-shrink-0">
				{book.coverImage ? (
					<img
						src={book.coverImage}
						alt={`Cover of ${book.title}`}
						className="w-full h-full object-cover block"
					/>
				) : (
					<div
						className="w-full h-full flex items-center justify-center text-muted-foreground"
						aria-hidden="true"
					>
						<BookOpen className="w-[40%] h-[40%] opacity-40" />
					</div>
				)}
			</div>

			<CardContent className="flex flex-col gap-1.5 pt-3">
				<div className="flex items-start justify-between gap-2">
					<h3 className="text-base font-semibold text-foreground leading-snug">
						{book.title}
					</h3>
					{isAuthenticated && isLibrarian && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive border border-transparent"
							onClick={(e) => {
								e.stopPropagation();
								deleteMutation.mutate(book.id);
							}}
							disabled={deleteMutation.isPending}
							aria-label={`Delete ${book.title}`}
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
				<p className="text-sm text-[#818cf8]">{book.author.name}</p>
				<div className="flex items-center gap-1.5 flex-wrap">
					<Badge variant="outline">{book.year}</Badge>
					<Badge
						variant="outline"
						className={book.availableCount > 0 ? "text-green-400 border-green-400/40" : "text-destructive border-destructive/40"}
					>
						{book.availableCount}/{book.totalCopies}
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}
