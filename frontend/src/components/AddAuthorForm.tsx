import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gqlClient } from "../api/client";
import { ADD_AUTHOR } from "../api/mutations";
import type { Author } from "../api/types";

interface AddAuthorFormProps {
  onClose: () => void;
}

export function AddAuthorForm({ onClose }: AddAuthorFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { name: string }) =>
      gqlClient.request<{ addAuthor: Author }>(ADD_AUTHOR, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Author</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Author name"
            />
          </div>
          {mutation.isError && (
            <p className="error-text">Failed to add author. Please try again.</p>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Author"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
