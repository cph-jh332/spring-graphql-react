const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG and WebP images are supported.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Image must be smaller than 5 MB.";
  }
  return null;
}

/**
 * Upload a cover image for the given book id.
 * Returns the public URL path of the stored image.
 */
export async function uploadBookCover(bookId: string, file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`/api/books/${bookId}/cover`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { coverImage: string };
  return data.coverImage;
}

/**
 * Delete the cover image for the given book id.
 */
export async function deleteBookCover(bookId: string): Promise<void> {
  const res = await fetch(`/api/books/${bookId}/cover`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Delete failed (${res.status}): ${text}`);
  }
}
