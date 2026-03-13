import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "../api/wsClient";
import { BOOK_ADDED_SUBSCRIPTION, BOOK_DELETED_SUBSCRIPTION } from "../api/queries";
import type { Book } from "../api/types";

export function useBookSubscription() {
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeAdded = wsClient.subscribe<{ bookAdded: Book }>(
      { query: BOOK_ADDED_SUBSCRIPTION },
      {
        next: ({ data }) => {
          if (data?.bookAdded) {
            setNewBooks((prev) => [data.bookAdded, ...prev].slice(0, 20));
            queryClient.invalidateQueries({ queryKey: ["books"] });
            queryClient.invalidateQueries({ queryKey: ["authors"] });
          }
        },
        error: (err) => {
          console.error("Subscription error:", err);
          setError("Lost connection to live feed.");
        },
        complete: () => console.log("bookAdded subscription completed."),
      }
    );

    const unsubscribeDeleted = wsClient.subscribe<{ bookDeleted: string }>(
      { query: BOOK_DELETED_SUBSCRIPTION },
      {
        next: ({ data }) => {
          if (data?.bookDeleted) {
            queryClient.invalidateQueries({ queryKey: ["books"] });
            queryClient.invalidateQueries({ queryKey: ["authors"] });
          }
        },
        error: (err) => console.error("bookDeleted subscription error:", err),
        complete: () => console.log("bookDeleted subscription completed."),
      }
    );

    return () => {
      unsubscribeAdded();
      unsubscribeDeleted();
    };
  }, [queryClient]);

  const clearFeed = () => setNewBooks([]);

  return { newBooks, error, clearFeed };
}
