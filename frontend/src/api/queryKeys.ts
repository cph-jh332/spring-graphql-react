export const queryKeys = {
  books: {
    all: ["books"] as const,
    list: (query?: string) => ["books", query ?? ""] as const,
  },
  authors: {
    all: ["authors"] as const,
    list: (query?: string) => ["authors", query ?? ""] as const,
  },
  users: {
    all: ["users"] as const,
  },
};
