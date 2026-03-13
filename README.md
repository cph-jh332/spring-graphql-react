# spring-graphql-react

A reactive monorepo POC — Spring Boot (WebFlux) + Spring for GraphQL + Reactive MongoDB on the backend, Vite + React + TypeScript + React Query + graphql-ws on the frontend.

## Architecture

```
spring-graphql-react/
├── backend/   Spring Boot 3.x (WebFlux, Spring GraphQL, Reactive MongoDB)
└── frontend/  Vite + React 18 + TypeScript
```

All data flows are fully non-blocking end-to-end:

- **Backend**: `ReactiveMongoRepository` → `Mono`/`Flux` service layer → Spring GraphQL controllers
- **Frontend**: React Query manages async state; `graphql-ws` handles the real-time subscription over WebSocket
- **Subscription**: A `Sinks.Many<Book>` in `BookService` broadcasts each newly created book to all active WebSocket subscribers

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
- GraphiQL playground: `http://localhost:8080/graphiql`
- WebSocket: `ws://localhost:8080/graphql`

On startup, `DataSeeder` drops and re-creates the database with 3 authors and 6 books.

### 3. Start the frontend

```bash
cd frontend
npm install   # if not already done
npm run dev
```

The frontend starts on **http://localhost:5173**.

The Vite dev server proxies all `/graphql` requests (HTTP and WebSocket) to the backend — no CORS issues during development.

## Features

- **Books page** — list, add, and delete books
- **Authors page** — list, add, and delete authors with their book collections
- **Live Feed** — real-time strip powered by a GraphQL subscription (`bookAdded`) via WebSocket; pulses green when active

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
}
```

## Key implementation notes

### Backend

| Pattern | Where |
|---|---|
| Schema-first GraphQL | `resources/graphql/schema.graphqls` |
| Reactive repository | `BookRepository`, `AuthorRepository` extend `ReactiveMongoRepository` |
| Reactive service layer | `BookService`, `AuthorService` return `Mono`/`Flux` |
| Subscription via `Sinks` | `BookService.bookSink` (`Sinks.Many.multicast`) emitted on `addBook` |
| N+1 avoidance | `@SchemaMapping` resolvers on `Book.author` and `Author.books` are called lazily — one DB call per field access, not one per list item |
| CORS | Reactive `CorsWebFilter` allows `localhost:5173` |
| Data seeding | `DataSeeder implements ApplicationRunner` using reactive chains |

### Frontend

| Pattern | Where |
|---|---|
| Server state | `@tanstack/react-query` — `useQuery` / `useMutation` |
| GraphQL HTTP client | `graphql-request` (`gqlClient`) |
| GraphQL WebSocket | `graphql-ws` (`wsClient`) |
| Subscription hook | `useBookSubscription` — manages lifecycle, appends to local state |
| Query invalidation | Mutations invalidate `["books"]` / `["authors"]` cache keys |
| Typed GQL | Queries and mutations defined in `src/api/queries.ts` / `mutations.ts` with TypeScript interfaces in `types.ts` |

## Environment variables (frontend)

| Variable | Default | Description |
|---|---|---|
| `VITE_GRAPHQL_URL` | `/graphql` | HTTP GraphQL endpoint |
| `VITE_GRAPHQL_WS_URL` | `ws://<host>/graphql` | WebSocket endpoint |
# spring-graphql-react
