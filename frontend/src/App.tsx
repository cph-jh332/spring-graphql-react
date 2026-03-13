import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { BooksPage } from "./pages/BooksPage";
import { AuthorsPage } from "./pages/AuthorsPage";
import { GraphiQLPage } from "./pages/GraphiQLPage";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 2,
    },
  },
});

function Layout() {
  const { pathname } = useLocation();
  const isGraphiQL = pathname === "/graphiql";

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-logo">
          Library
        </Link>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Books
          </NavLink>
          <NavLink to="/authors" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Authors
          </NavLink>
          <NavLink to="/graphiql" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            GraphiQL
          </NavLink>
        </nav>
      </header>
      {isGraphiQL ? (
        // Full-height, no padding wrapper for GraphiQL
        <Routes>
          <Route path="/graphiql" element={<GraphiQLPage />} />
        </Routes>
      ) : (
        <main className="app-main">
          <Routes>
            <Route path="/" element={<BooksPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
          </Routes>
        </main>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
