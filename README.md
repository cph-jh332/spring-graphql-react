# spring-graphql-react

A reactive monorepo POC — Spring Boot (WebFlux) + Spring for GraphQL + Reactive MongoDB on the backend, Vite + React + TypeScript + React Query + graphql-ws on the frontend.

## Architecture

```
spring-graphql-react/
├── backend/   Spring Boot 3.x (WebFlux, Spring GraphQL, Reactive MongoDB)
└── frontend/  Vite + React 19 + TypeScript
```

All data flows are fully non-blocking end-to-end:

- **Backend**: `ReactiveMongoRepository` → `Mono`/`Flux` service layer → Spring GraphQL controllers
- **Frontend**: React Query manages async state; `graphql-ws` handles real-time subscriptions over WebSocket
- **Subscriptions**: `Sinks.Many` hot multicasts in `BookService` and `AuthorService` broadcast new entities to all active WebSocket subscribers

## Prerequisites

| Tool | Version |
|---|---|
| Java | 21+ |
| Maven | 3.9+ |
| Node.js | 20+ |
| MongoDB | 6+ (running on `localhost:27017`) |

## Getting started

### 1. Start MongoDB

```bash
# Docker (quick option)
docker run -d -p 27017:27017 --name mongo mongo:7

# Or use your own MongoDB installation
```

### 2. Start the backend

```bash
cd backend

# With Maven wrapper (generated automatically on first Maven build):
./mvnw spring-boot:run

# Or with a system Maven installation:
mvn spring-boot:run
```

> To generate the Maven wrapper: `mvn wrapper:wrapper` from the `backend/` directory.

The backend starts on **http://localhost:8080**.

- GraphQL endpoint: `http://localhost:8080/graphql`
- WebSocket: `ws://localhost:8080/graphql`

On first startup, `DataSeeder` seeds 3 authors and 6 books if the database is empty. Existing data is never deleted on restart.

### 3. Start the frontend

```bash
cd frontend
npm install   # if not already done
npm run dev
```

The frontend starts on **http://localhost:5173**.

The Vite dev server proxies all `/graphql` requests (HTTP and WebSocket) to the backend — no CORS issues during development.

## Features

- **Books page** — list, add, and delete books; real-time live feed via `bookAdded` subscription
- **Authors page** — list, add, and delete authors with their book collections; real-time live feed via `authorAdded` subscription; automatically updates when a book is added to an author
- **Live feeds** — WebSocket subscription strips that pulse green when active, showing the last 20 events

## GraphQL Schema

```graphql
type Query {
  books: [Book!]!
  book(id: ID!): Book
  authors: [Author!]!
  author(id: ID!): Author
}

type Mutation {
  addBook(input: BookInput!): Book!
  deleteBook(id: ID!): Boolean!
  addAuthor(input: AuthorInput!): Author!
  deleteAuthor(id: ID!): Boolean!
}

type Subscription {
  bookAdded: Book!
  authorAdded: Author!
}

type Book {
  id: ID!
  title: String!
  year: Int!
  author: Author!
}

type Author {
  id: ID!
  name: String!
  books: [Book!]!
}
```

`Book.author` and `Author.books` are virtual fields resolved via `@SchemaMapping` — the MongoDB documents only store `authorId` as a string foreign key.

## Key implementation notes

### Backend

| Pattern | Where |
|---|---|
| Schema-first GraphQL | `resources/graphql/schema.graphqls` |
| Reactive repository | `BookRepository`, `AuthorRepository` extend `ReactiveMongoRepository` |
| Reactive service layer | `BookService`, `AuthorService` return `Mono`/`Flux` |
| Subscriptions via `Sinks` | `bookSink` and `authorSink` (`Sinks.Many.multicast().directBestEffort()`) emitted on `addBook` / `addAuthor` |
| N+1 avoidance | `@SchemaMapping` resolvers on `Book.author` and `Author.books` are called lazily — one DB call per field access, not one per list item |
| CORS | Reactive `CorsWebFilter` allows `localhost:5173` and `localhost:3000` |
| Data seeding | `DataSeeder implements ApplicationRunner` — checks `authorRepository.count()` first; skips if data already exists |

### Frontend

| Pattern | Where |
|---|---|
| Server state | `@tanstack/react-query` — `useQuery` / `useMutation` |
| GraphQL HTTP client | `graphql-request` (`gqlClient`) |
| GraphQL WebSocket | `graphql-ws` (`wsClient`) |
| Subscription hooks | `useBookSubscription`, `useAuthorSubscription` — manage WS lifecycle, maintain rolling local buffer of last 20 events |
| Query invalidation | `bookAdded` events invalidate both `["books"]` and `["authors"]` cache keys so the authors page updates reactively when a book is added |
| Typed GQL | Queries/subscriptions in `src/api/queries.ts`, mutations in `src/api/mutations.ts`, TypeScript interfaces in `src/api/types.ts` |

## Environment variables (frontend)

| Variable | Default | Description |
|---|---|---|
| `VITE_GRAPHQL_URL` | `/graphql` | HTTP GraphQL endpoint |
| `VITE_GRAPHQL_WS_URL` | `ws://<host>/graphql` | WebSocket endpoint |
