import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { print } from "graphql";
import { wsClient } from "../api/wsClient";
import { AUTHOR_ADDED_SUBSCRIPTION, AUTHOR_DELETED_SUBSCRIPTION } from "../api/queries";
import type { OnAuthorAddedSubscription, OnAuthorDeletedSubscription } from "../gql/graphql";

export function useAuthorSubscription() {
  const [newAuthors, setNewAuthors] = useState<OnAuthorAddedSubscription["authorAdded"][]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeAdded = wsClient.subscribe<OnAuthorAddedSubscription>(
      { query: print(AUTHOR_ADDED_SUBSCRIPTION) },
      {
        next: ({ data }) => {
          if (data?.authorAdded) {
            setNewAuthors((prev) => [data.authorAdded, ...prev].slice(0, 20));
            queryClient.invalidateQueries({ queryKey: ["authors"] });
          }
        },
        error: (err) => {
          console.error("Author subscription error:", err);
          setError("Lost connection to live feed.");
        },
        complete: () => console.log("authorAdded subscription completed."),
      }
    );

    const unsubscribeDeleted = wsClient.subscribe<OnAuthorDeletedSubscription>(
      { query: print(AUTHOR_DELETED_SUBSCRIPTION) },
      {
        next: ({ data }) => {
          if (data?.authorDeleted) {
            queryClient.invalidateQueries({ queryKey: ["authors"] });
            queryClient.invalidateQueries({ queryKey: ["books"] });
          }
        },
        error: (err) => console.error("authorDeleted subscription error:", err),
        complete: () => console.log("authorDeleted subscription completed."),
      }
    );

    return () => {
      unsubscribeAdded();
      unsubscribeDeleted();
    };
  }, [queryClient]);

  const clearFeed = () => setNewAuthors([]);

  return { newAuthors, error, clearFeed };
}
