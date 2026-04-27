import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Clock } from "lucide-react";
import { gqlClient } from "../api/client";
import { GET_BOOKS } from "../api/queries";
import { queryKeys } from "../api/queryKeys";
import { BookCard } from "../components/BookCard";
import { BookDetailModal } from "../components/BookDetailModal";
import { useAuth } from "../context/AuthContext";
import type { GetBooksQuery } from "../gql/graphql";

type Book = GetBooksQuery["books"][number];

const LOAN_DAYS = 14;
const WARN_DAYS = 10; // warn at day 10 = 4 days left

type LoanStatus = "overdue" | "due-soon" | "ok";

function getLoanStatus(borrowedAt: string): LoanStatus {
	const daysElapsed = (Date.now() - new Date(borrowedAt).getTime()) / (1000 * 60 * 60 * 24);
	if (daysElapsed >= LOAN_DAYS) return "overdue";
	if (daysElapsed >= WARN_DAYS) return "due-soon";
	return "ok";
}

function getDueDate(borrowedAt: string): string {
	const due = new Date(new Date(borrowedAt).getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);
	return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDaysOverdue(borrowedAt: string): number {
	const daysElapsed = (Date.now() - new Date(borrowedAt).getTime()) / (1000 * 60 * 60 * 24);
	return Math.floor(daysElapsed - LOAN_DAYS);
}

function getDaysLeft(borrowedAt: string): number {
	const daysElapsed = (Date.now() - new Date(borrowedAt).getTime()) / (1000 * 60 * 60 * 24);
	return Math.ceil(LOAN_DAYS - daysElapsed);
}

export function BorrowedBooksPage() {
	const { isAuthenticated, user, isLoading } = useAuth();
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);

	const { data, isLoading: booksLoading } = useQuery({
		queryKey: queryKeys.books.all,
		queryFn: () => gqlClient.request(GET_BOOKS, {}),
		enabled: isAuthenticated,
	});

	if (isLoading) return null;
	if (!isAuthenticated) return <Navigate to="/login" replace />;

	const borrowedRecords = user?.borrowedRecords ?? [];
	const recordByBookId = new Map(borrowedRecords.map((r) => [r.bookId, r]));
	const borrowedBooks = (data?.books ?? []).filter((b) => recordByBookId.has(b.id));

	const overdueBooks = borrowedBooks.filter((b) => {
		const rec = recordByBookId.get(b.id)!;
		return getLoanStatus(rec.borrowedAt) === "overdue";
	});
	const dueSoonBooks = borrowedBooks.filter((b) => {
		const rec = recordByBookId.get(b.id)!;
		return getLoanStatus(rec.borrowedAt) === "due-soon";
	});

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-foreground">My Borrowed Books</h1>
				<span className="text-sm text-muted-foreground">
					{borrowedBooks.length} {borrowedBooks.length === 1 ? "book" : "books"}
				</span>
			</div>

			{/* Overdue alert */}
			{overdueBooks.length > 0 && (
				<div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
					<div className="flex flex-col gap-0.5">
						<span className="font-semibold">
							{overdueBooks.length} overdue {overdueBooks.length === 1 ? "book" : "books"}
						</span>
						<span className="text-destructive/80">
							{overdueBooks.map((b) => {
								const rec = recordByBookId.get(b.id)!;
								return `"${b.title}" (${getDaysOverdue(rec.borrowedAt)} day${getDaysOverdue(rec.borrowedAt) !== 1 ? "s" : ""} overdue)`;
							}).join(", ")}
						</span>
					</div>
				</div>
			)}

			{/* Due-soon alert */}
			{dueSoonBooks.length > 0 && (
				<div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
					<Clock className="mt-0.5 h-4 w-4 shrink-0" />
					<div className="flex flex-col gap-0.5">
						<span className="font-semibold">
							{dueSoonBooks.length} {dueSoonBooks.length === 1 ? "book" : "books"} due soon
						</span>
						<span className="text-yellow-400/80">
							{dueSoonBooks.map((b) => {
								const rec = recordByBookId.get(b.id)!;
								return `"${b.title}" (${getDaysLeft(rec.borrowedAt)} day${getDaysLeft(rec.borrowedAt) !== 1 ? "s" : ""} left)`;
							}).join(", ")}
						</span>
					</div>
				</div>
			)}

			{/* Book grid */}
			{booksLoading ? (
				<div className="text-sm text-muted-foreground">Loading…</div>
			) : borrowedBooks.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
					<BookOpen className="w-12 h-12 opacity-30" />
					<p className="text-sm">You haven't borrowed any books yet.</p>
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
					{borrowedBooks.map((book) => {
						const rec = recordByBookId.get(book.id)!;
						const status = getLoanStatus(rec.borrowedAt);
						const dueDate = getDueDate(rec.borrowedAt);
						return (
							<div key={book.id} className="flex flex-col gap-1">
								<BookCard book={book} onSelect={setSelectedBook} />
								<div className="flex flex-col items-start px-1 gap-0.5">
									<span className="text-xs text-muted-foreground">
										Due {dueDate}
									</span>
									{status === "overdue" && (
										<span className="text-xs font-semibold px-1.5 py-0 rounded-full bg-destructive/15 text-destructive">
											Overdue
										</span>
									)}
									{status === "due-soon" && (
										<span className="text-xs font-semibold px-1.5 py-0 rounded-full bg-yellow-500/15 text-yellow-400">
											Due in {getDaysLeft(rec.borrowedAt)}d
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{selectedBook && (
				<BookDetailModal
					book={selectedBook}
					onClose={() => setSelectedBook(null)}
				/>
			)}
		</div>
	);
}
