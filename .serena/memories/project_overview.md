# Project: spring-graphql-react

## Purpose
A full-stack library management app. Browse/add/delete books and authors, with live GraphQL subscriptions for real-time updates.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TanStack Query, React Router v7, GraphQL (graphql-request, graphql-ws), GraphQL Codegen
- **Backend**: Spring Boot (Java), Spring GraphQL, pom.xml in /backend
- **Linting/Formatting**: Biome (`biome.json`), ESLint (`eslint.config.js`)
- **No Tailwind / shadcn yet**

## Frontend Structure
- `frontend/src/App.tsx` — root layout, nav, subscription hooks wired at root
- `frontend/src/pages/` — BooksPage.tsx, AuthorsPage.tsx, GraphiQLPage.tsx
- `frontend/src/components/` — BookCard, BookList, AddBookForm, AddAuthorForm, BookDetailModal, LiveFeed, AuthorLiveFeed
- `frontend/src/index.css` — all custom CSS (dark theme, CSS vars, homemade components)
- `frontend/src/api/` — GraphQL queries/mutations, upload API, WS client
- `frontend/src/hooks/` — useBookSubscription, useAuthorSubscription
- `frontend/src/gql/` — generated GraphQL types

## Commands
```
# Frontend dev
cd frontend && npm run dev        # Vite dev server on :5173
cd frontend && npm run build      # tsc + vite build
cd frontend && npm run lint       # ESLint
cd frontend && npx biome check .  # Biome lint+format
cd frontend && npm run codegen    # Regenerate GraphQL types
```
