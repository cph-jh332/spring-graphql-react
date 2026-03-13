import { createClient } from "graphql-ws";

// Vite proxy forwards ws:// upgrades on /graphql to the backend.
// Construct the WebSocket URL from the current page's host.
function getWsEndpoint(): string {
  if (import.meta.env.VITE_GRAPHQL_WS_URL) {
    return import.meta.env.VITE_GRAPHQL_WS_URL;
  }
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/graphql`;
}

export const wsClient = createClient({
  url: getWsEndpoint(),
  retryAttempts: 5,
  shouldRetry: () => true,
});
