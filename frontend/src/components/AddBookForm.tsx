import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { gqlClient } from "../api/client";
import { ADD_BOOK } from "../api/mutations";
import { GET_AUTHORS } from "../api/queries";
import { uploadBookCover, validateImageFile } from "../api/uploadApi";

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
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<h2>Add New Book</h2>
				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="title">Title</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							placeholder="Book title"
						/>
					</div>
					<div className="form-group">
						<label htmlFor="year">Year</label>
						<input
							id="year"
							type="number"
							value={year}
							onChange={(e) => setYear(Number(e.target.value))}
							required
							min={1}
						/>
					</div>
					<div className="form-group">
						<label htmlFor="author">Author</label>
						<select
							id="author"
							value={authorId}
							onChange={(e) => setAuthorId(e.target.value)}
							required
						>
							<option value="">Select an author</option>
							{authorsData?.authors.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name}
								</option>
							))}
						</select>
					</div>

					{/* Cover image upload */}
					<div className="form-group">
						<label>Cover Image (optional)</label>
						{coverPreview ? (
							<div className="cover-preview-wrap">
								<img
									src={coverPreview}
									alt="Cover preview"
									className="cover-preview"
								/>
								<button
									type="button"
									className="btn btn-secondary"
									onClick={handleRemoveCover}
									style={{ marginTop: 8 }}
								>
									Remove
								</button>
							</div>
						) : (
							<label className="file-upload-label" htmlFor="cover-file">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									width="20"
									height="20"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
									/>
								</svg>
								Choose image
								<input
									id="cover-file"
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleFileChange}
									style={{ display: "none" }}
								/>
							</label>
						)}
						{fileError && <p className="error-text">{fileError}</p>}
					</div>

					{mutation.isError && (
						<p className="error-text">Failed to add book. Please try again.</p>
					)}
					<div className="form-actions">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={onClose}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isPending}
						>
							{isPending
								? uploading
									? "Uploading..."
									: "Adding..."
								: "Add Book"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
