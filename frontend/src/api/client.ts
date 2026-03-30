import { GraphQLClient } from "graphql-request";

// graphql-request requires an absolute URL (uses new URL() internally).
// Fall back to constructing one from window.location so the Vite proxy still works.
const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_URL ??
  `${window.location.protocol}//${window.location.host}/graphql`;

export const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  // Send the HttpOnly access_token cookie with every request so that
  // @PreAuthorize-protected mutations are authenticated.
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});
