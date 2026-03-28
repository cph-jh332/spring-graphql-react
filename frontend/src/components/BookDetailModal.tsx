import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";
import {
	deleteBookCover,
	uploadBookCover,
	validateImageFile,
} from "../api/uploadApi";
import type { GetBooksQuery } from "../gql/graphql";

type Book = GetBooksQuery["books"][number];

interface BookDetailModalProps {
	book: Book;
	onClose: () => void;
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Local optimistic state for the cover so the UI updates immediately
	const [coverSrc, setCoverSrc] = useState<string | undefined>(
		book.coverImage ?? undefined,
	);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

		// Show local preview immediately
		const preview = URL.createObjectURL(file);
		setCoverSrc(preview);

		try {
			const path = await uploadBookCover(book.id, file);
			// Replace blob URL with the real server URL
			URL.revokeObjectURL(preview);
			setCoverSrc(path);
			queryClient.invalidateQueries({ queryKey: ["books"] });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed.");
			setCoverSrc(book.coverImage ?? undefined); // revert
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
			queryClient.invalidateQueries({ queryKey: ["books"] });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed.");
		} finally {
			setDeleting(false);
		}
	};

	const isBusy = uploading || deleting;

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

				{/* Book details */}
				<div className="flex flex-col gap-1.5 text-center">
					<h2 className="text-xl font-bold text-foreground">{book.title}</h2>
					<p className="text-sm text-[#818cf8]">{book.author.name}</p>
					<span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full self-center">
						{book.year}
					</span>
				</div>

				{/* Cover actions */}
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
						<Button
							type="button"
							variant="secondary"
							onClick={handleDeleteCover}
							disabled={isBusy}
						>
							<X className="h-4 w-4" />
							{deleting ? "Removing…" : "Remove cover"}
						</Button>
					)}
				</div>

				{error && (
					<p className="text-xs text-destructive text-center">{error}</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
