import { GraphQLClient } from "graphql-request";

// graphql-request requires an absolute URL (uses new URL() internally).
// Fall back to constructing one from window.location so the Vite proxy still works.
const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_URL ??
  `${window.location.protocol}//${window.location.host}/graphql`;

export const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "Content-Type": "application/json",
  },
});
