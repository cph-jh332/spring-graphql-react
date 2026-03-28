import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { gqlClient } from "../api/client";
import { ADD_BOOK } from "../api/mutations";
import { GET_AUTHORS } from "../api/queries";
import { uploadBookCover, validateImageFile } from "../api/uploadApi";
import { useQuery } from "@tanstack/react-query";

interface AddBookFormProps {
	onClose: () => void;
}

export function AddBookForm({ onClose }: AddBookFormProps) {
	const queryClient = useQueryClient();
	const [title, setTitle] = useState("");
	const [year, setYear] = useState(new Date().getFullYear());
	const [authorId, setAuthorId] = useState("");
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [coverPreview, setCoverPreview] = useState<string | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data: authorsData } = useQuery({
		queryKey: ["authors"],
		queryFn: () => gqlClient.request(GET_AUTHORS, {}),
	});

	const mutation = useMutation({
		mutationFn: (input: { title: string; year: number; authorId: string }) =>
			gqlClient.request(ADD_BOOK, { input }),
		onSuccess: async ({ addBook }) => {
			if (coverFile) {
				setUploading(true);
				try {
					await uploadBookCover(addBook.id, coverFile);
				} catch {
					// Non-fatal: book was created, cover upload failed
				} finally {
					setUploading(false);
				}
			}
			queryClient.invalidateQueries({ queryKey: ["books"] });
			queryClient.invalidateQueries({ queryKey: ["authors"] });
			onClose();
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setFileError(null);
		setCoverFile(null);
		if (coverPreview) URL.revokeObjectURL(coverPreview);
		setCoverPreview(null);

		if (!file) return;

		const error = validateImageFile(file);
		if (error) {
			setFileError(error);
			return;
		}

		setCoverFile(file);
		setCoverPreview(URL.createObjectURL(file));
	};

	const handleRemoveCover = () => {
		setCoverFile(null);
		if (coverPreview) URL.revokeObjectURL(coverPreview);
		setCoverPreview(null);
		setFileError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!authorId) return;
		mutation.mutate({ title, year, authorId });
	};

	const isPending = mutation.isPending || uploading;

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent className="max-w-[440px]">
				<DialogHeader>
					<DialogTitle>Add New Book</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
								placeholder="Book title"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="year">Year</Label>
							<Input
								id="year"
								type="number"
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
								required
								min={1}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="author-select">Author</Label>
							<Select value={authorId} onValueChange={setAuthorId} required>
								<SelectTrigger id="author-select">
									<SelectValue placeholder="Select an author" />
								</SelectTrigger>
								<SelectContent>
									{authorsData?.authors.map((a) => (
										<SelectItem key={a.id} value={a.id}>
											{a.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>Cover Image (optional)</Label>
							{coverPreview ? (
								<div className="flex flex-col items-start gap-2">
									<img
										src={coverPreview}
										alt="Cover preview"
										className="w-[120px] h-[180px] object-cover rounded-md border border-border"
									/>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={handleRemoveCover}
									>
										Remove
									</Button>
								</div>
							) : (
								<label
									className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary border border-dashed border-border rounded-md text-sm text-muted-foreground cursor-pointer transition-colors hover:border-primary hover:text-[#818cf8]"
									htmlFor="cover-file"
								>
									<Upload className="w-4 h-4" />
									Choose image
									<input
										id="cover-file"
										ref={fileInputRef}
										type="file"
										accept="image/jpeg,image/png,image/webp"
										onChange={handleFileChange}
										className="hidden"
									/>
								</label>
							)}
							{fileError && (
								<p className="text-xs text-destructive">{fileError}</p>
							)}
						</div>

						{mutation.isError && (
							<p className="text-xs text-destructive">
								Failed to add book. Please try again.
							</p>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending
								? uploading
									? "Uploading..."
									: "Adding..."
								: "Add Book"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
