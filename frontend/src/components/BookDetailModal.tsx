import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Upload, X, Pencil, Check } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	deleteBookCover,
	uploadBookCover,
	validateImageFile,
} from "../api/uploadApi";
import { queryKeys } from "../api/queryKeys";
import { gqlClient } from "../api/client";
import { BORROW_BOOK, RETURN_BOOK, UPDATE_BOOK } from "../api/mutations";
import { GET_AUTHORS } from "../api/queries";
import { useAuth } from "../context/AuthContext";
import type { BorrowRecord } from "../context/AuthContext";
import { Role } from "../gql/graphql";
import type { GetBooksQuery } from "../gql/graphql";
import { useQuery } from "@tanstack/react-query";

type Book = GetBooksQuery["books"][number];

const LOAN_DAYS = 14;
const WARN_DAYS = 10; // warn when ≥10 days borrowed (4 days left)

type LoanStatus = "overdue" | "due-soon" | "ok";

function getLoanStatus(borrowedAt: string): LoanStatus {
	const borrowedMs = new Date(borrowedAt).getTime();
	const daysElapsed = (Date.now() - borrowedMs) / (1000 * 60 * 60 * 24);
	if (daysElapsed >= LOAN_DAYS) return "overdue";
	if (daysElapsed >= WARN_DAYS) return "due-soon";
	return "ok";
}

function getDueDate(borrowedAt: string): string {
	const due = new Date(new Date(borrowedAt).getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);
	return due.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getDaysLeft(borrowedAt: string): number {
	const borrowedMs = new Date(borrowedAt).getTime();
	const daysElapsed = (Date.now() - borrowedMs) / (1000 * 60 * 60 * 24);
	return Math.max(0, LOAN_DAYS - daysElapsed);
}

interface BookDetailModalProps {
	book: Book;
	onClose: () => void;
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { isAuthenticated, user, refreshUser } = useAuth();
	const isLibrarian = user?.roles.includes(Role.Librarian);
	const borrowRecord = user?.borrowedRecords.find((r) => r.bookId === book.id) ?? null;
	const hasBorrowed = borrowRecord !== null;

	// Local optimistic state for the cover so the UI updates immediately
	const [coverSrc, setCoverSrc] = useState<string | undefined>(
		book.coverImage ?? undefined,
	);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Librarian edit state
	const [editing, setEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(book.title);
	const [editYear, setEditYear] = useState(book.year);
	const [editAuthorId, setEditAuthorId] = useState(book.author.id);
	const [editTotalCopies, setEditTotalCopies] = useState(book.totalCopies);

	const { data: authorsData } = useQuery({
		queryKey: queryKeys.authors.all,
		queryFn: () => gqlClient.request(GET_AUTHORS, {}),
		enabled: !!isLibrarian && editing,
	});

	const updateMutation = useMutation({
		mutationFn: (input: { title: string; year: number; authorId: string; totalCopies: number }) =>
			gqlClient.request(UPDATE_BOOK, { id: book.id, input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
			setEditing(false);
		},
		onError: (err: unknown) => {
			setError(err instanceof Error ? err.message : "Update failed.");
		},
	});

	const borrowMutation = useMutation({
		mutationFn: () => gqlClient.request(BORROW_BOOK, { bookId: book.id }),
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
			await refreshUser();
		},
		onError: (err: unknown) => {
			setError(err instanceof Error ? err.message : "Borrow failed.");
		},
	});

	const returnMutation = useMutation({
		mutationFn: () => gqlClient.request(RETURN_BOOK, { bookId: book.id }),
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
			await refreshUser();
		},
		onError: (err: unknown) => {
			setError(err instanceof Error ? err.message : "Return failed.");
		},
	});

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validationError = validateImageFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
		setUploading(true);

		const preview = URL.createObjectURL(file);
		setCoverSrc(preview);

		try {
			const path = await uploadBookCover(book.id, file);
			URL.revokeObjectURL(preview);
			setCoverSrc(path);
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed.");
			setCoverSrc(book.coverImage ?? undefined);
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleDeleteCover = async () => {
		setDeleting(true);
		setError(null);
		try {
			await deleteBookCover(book.id);
			setCoverSrc(undefined);
			queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed.");
		} finally {
			setDeleting(false);
		}
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editAuthorId) return;
		updateMutation.mutate({ title: editTitle, year: editYear, authorId: editAuthorId, totalCopies: editTotalCopies });
	};

	const isBusy = uploading || deleting;
	const availableCount = book.availableCount;

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent className="max-w-[480px] p-6 flex flex-col gap-4 max-h-[calc(100svh-48px)] overflow-y-auto">
				{/* Cover image area */}
				<div className="relative w-full aspect-[2/3] max-h-[340px] max-w-[220px] self-center rounded-xl overflow-hidden bg-secondary border border-border">
					{coverSrc ? (
						<img
							src={coverSrc}
							alt={`Cover of ${book.title}`}
							className="w-full h-full object-cover block"
						/>
					) : (
						<div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
							<BookOpen className="w-12 h-12 opacity-40" />
							<span>No cover</span>
						</div>
					)}
					{uploading && (
						<div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-sm font-medium">
							Uploading…
						</div>
					)}
				</div>

				{/* Book details / edit form */}
				{editing && isLibrarian ? (
					<form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-title">Title</Label>
							<Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-year">Year</Label>
							<Input id="edit-year" type="number" value={editYear} onChange={(e) => setEditYear(Number(e.target.value))} required min={1} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-copies">Total Copies</Label>
							<Input id="edit-copies" type="number" value={editTotalCopies} onChange={(e) => setEditTotalCopies(Number(e.target.value))} required min={1} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-author">Author</Label>
							<Select value={editAuthorId} onValueChange={setEditAuthorId} required>
								<SelectTrigger id="edit-author">
									<SelectValue placeholder="Select an author" />
								</SelectTrigger>
								<SelectContent>
									{authorsData?.authors.map((a) => (
										<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex gap-2 justify-center">
							<Button type="submit" disabled={updateMutation.isPending}>
								<Check className="h-4 w-4" />
								{updateMutation.isPending ? "Saving…" : "Save"}
							</Button>
							<Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
						</div>
					</form>
				) : (
					<div className="flex flex-col gap-1.5 text-center">
						<h2 className="text-xl font-bold text-foreground">{book.title}</h2>
						<p className="text-sm text-[#818cf8]">{book.author.name}</p>
						<span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full self-center">
							{book.year}
						</span>
						<span className={`text-xs px-2 py-0.5 rounded-full self-center font-medium ${availableCount > 0 ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
							{availableCount} / {book.totalCopies} available
						</span>
						{borrowRecord && (() => {
							const status = getLoanStatus(borrowRecord.borrowedAt);
							const dueDate = getDueDate(borrowRecord.borrowedAt);
							const daysLeft = getDaysLeft(borrowRecord.borrowedAt);
							const borrowedDate = new Date(borrowRecord.borrowedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
							return (
								<div className="flex flex-col items-center gap-1 mt-1">
									<span className="text-xs text-muted-foreground">
										Borrowed {borrowedDate} · Due {dueDate}
									</span>
									{status === "overdue" && (
										<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
											Overdue
										</span>
									)}
									{status === "due-soon" && (
										<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
											Due in {Math.ceil(daysLeft)} day{Math.ceil(daysLeft) !== 1 ? "s" : ""}
										</span>
									)}
								</div>
							);
						})()}
					</div>
				)}

				{/* Cover actions (librarian only) */}
				{isLibrarian && !editing && (
					<div className="flex gap-2.5 justify-center flex-wrap">
						<Button type="button" variant="secondary" onClick={() => setEditing(true)}>
							<Pencil className="h-4 w-4" />
							Edit book
						</Button>
						<Button type="button" variant="secondary" asChild className="cursor-pointer">
							<label htmlFor="detail-cover-file" className="cursor-pointer">
								<Upload className="h-4 w-4" />
								{coverSrc ? "Change cover" : "Upload cover"}
								<input
									id="detail-cover-file"
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleFileChange}
									disabled={isBusy}
									className="hidden"
								/>
							</label>
						</Button>
						{coverSrc && (
							<Button type="button" variant="secondary" onClick={handleDeleteCover} disabled={isBusy}>
								<X className="h-4 w-4" />
								{deleting ? "Removing…" : "Remove cover"}
							</Button>
						)}
					</div>
				)}

				{/* Cover actions (non-librarian) */}
				{!isLibrarian && !editing && (
					<div className="flex gap-2.5 justify-center flex-wrap">
						<Button
							type="button"
							variant="secondary"
							asChild
							className="cursor-pointer"
						>
							<label htmlFor="detail-cover-file" className="cursor-pointer">
								<Upload className="h-4 w-4" />
								{coverSrc ? "Change cover" : "Upload cover"}
								<input
									id="detail-cover-file"
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleFileChange}
									disabled={isBusy}
									className="hidden"
								/>
							</label>
						</Button>
						{coverSrc && (
							<Button type="button" variant="secondary" onClick={handleDeleteCover} disabled={isBusy}>
								<X className="h-4 w-4" />
								{deleting ? "Removing…" : "Remove cover"}
							</Button>
						)}
					</div>
				)}

				{/* Borrow / Return (authenticated users) */}
				{isAuthenticated && !editing && (
					<div className="flex justify-center">
						{hasBorrowed ? (
							<Button
								type="button"
								variant="secondary"
								onClick={() => returnMutation.mutate()}
								disabled={returnMutation.isPending}
							>
								{returnMutation.isPending ? "Returning…" : "Return book"}
							</Button>
						) : (
							<Button
								type="button"
								onClick={() => borrowMutation.mutate()}
								disabled={borrowMutation.isPending || availableCount === 0}
							>
								{borrowMutation.isPending
									? "Borrowing…"
									: availableCount === 0
										? "No copies available"
										: "Borrow book"}
							</Button>
						)}
					</div>
				)}

				{error && (
					<p className="text-xs text-destructive text-center">{error}</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
