import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { GetBooksQuery } from "../gql/graphql";
import {
  deleteBookCover,
  uploadBookCover,
  validateImageFile,
} from "../api/uploadApi";

type Book = GetBooksQuery["books"][number];

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local optimistic state for the cover so the UI updates immediately
  const [coverSrc, setCoverSrc] = useState<string | undefined>(book.coverImage ?? undefined);
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--detail"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Cover image area */}
        <div className="detail-cover-wrap">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={`Cover of ${book.title}`}
              className="detail-cover-img"
            />
          ) : (
            <div className="detail-cover-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>No cover</span>
            </div>
          )}
          {uploading && <div className="cover-uploading-overlay">Uploading…</div>}
        </div>

        {/* Book details */}
        <div className="detail-info">
          <h2 className="detail-title">{book.title}</h2>
          <p className="detail-author">{book.author.name}</p>
          <span className="book-year">{book.year}</span>
        </div>

        {/* Cover actions */}
        <div className="detail-cover-actions">
          <label className="btn btn-secondary" htmlFor="detail-cover-file" style={{ cursor: "pointer" }}>
            {coverSrc ? "Change cover" : "Upload cover"}
            <input
              id="detail-cover-file"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isBusy}
              style={{ display: "none" }}
            />
          </label>
          {coverSrc && (
            <button
              className="btn btn-secondary"
              onClick={handleDeleteCover}
              disabled={isBusy}
            >
              {deleting ? "Removing…" : "Remove cover"}
            </button>
          )}
        </div>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}
