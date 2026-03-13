import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "../api/wsClient";
import { BOOK_ADDED_SUBSCRIPTION } from "../api/queries";
import type { Book } from "../api/types";

export function useBookSubscription() {
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = wsClient.subscribe<{ bookAdded: Book }>(
      { query: BOOK_ADDED_SUBSCRIPTION },
      {
        next: ({ data }) => {
          if (data?.bookAdded) {
            // Show the new book in the live feed strip
            setNewBooks((prev) => [data.bookAdded, ...prev].slice(0, 20));
            // Invalidate the books query so every open browser tab refetches the list
            queryClient.invalidateQueries({ queryKey: ["books"] });
            // Also invalidate authors so the author page reflects the new book
            queryClient.invalidateQueries({ queryKey: ["authors"] });
          }
        },
        error: (err) => {
          console.error("Subscription error:", err);
          setError("Lost connection to live feed.");
        },
        complete: () => {
          console.log("Subscription completed.");
        },
      }
    );

    return () => unsubscribe();
  }, [queryClient]);

  const clearFeed = () => setNewBooks([]);

  return { newBooks, error, clearFeed };
}
