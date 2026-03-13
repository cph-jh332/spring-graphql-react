import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gqlClient } from "../api/client";
import { ADD_BOOK } from "../api/mutations";
import { GET_AUTHORS } from "../api/queries";
import type { Author, Book } from "../api/types";
import { useQuery } from "@tanstack/react-query";

interface AddBookFormProps {
  onClose: () => void;
}

export function AddBookForm({ onClose }: AddBookFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [authorId, setAuthorId] = useState("");

  const { data: authorsData } = useQuery<{ authors: Author[] }>({
    queryKey: ["authors"],
    queryFn: () => gqlClient.request(GET_AUTHORS),
  });

  const mutation = useMutation({
    mutationFn: (input: { title: string; year: number; authorId: string }) =>
      gqlClient.request<{ addBook: Book }>(ADD_BOOK, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorId) return;
    mutation.mutate({ title, year, authorId });
  };

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
          {mutation.isError && (
            <p className="error-text">Failed to add book. Please try again.</p>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
