import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "../api/wsClient";
import { AUTHOR_ADDED_SUBSCRIPTION } from "../api/queries";
import type { Author } from "../api/types";

export function useAuthorSubscription() {
  const [newAuthors, setNewAuthors] = useState<Author[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = wsClient.subscribe<{ authorAdded: Author }>(
      { query: AUTHOR_ADDED_SUBSCRIPTION },
      {
        next: ({ data }) => {
          if (data?.authorAdded) {
            // Show the new author in the live feed strip
            setNewAuthors((prev) => [data.authorAdded, ...prev].slice(0, 20));
            // Invalidate the authors query so every open browser tab refetches the list
            queryClient.invalidateQueries({ queryKey: ["authors"] });
          }
        },
        error: (err) => {
          console.error("Author subscription error:", err);
          setError("Lost connection to live feed.");
        },
        complete: () => {
          console.log("Author subscription completed.");
        },
      }
    );

    return () => unsubscribe();
  }, [queryClient]);

  const clearFeed = () => setNewAuthors([]);

  return { newAuthors, error, clearFeed };
}
