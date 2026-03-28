import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	BrowserRouter,
	Link,
	NavLink,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import { useAuthorSubscription } from "./hooks/useAuthorSubscription";
import { useBookSubscription } from "./hooks/useBookSubscription";
import { AuthorsPage } from "./pages/AuthorsPage";
import { BooksPage } from "./pages/BooksPage";
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

	// Both subscriptions are kept alive at the app root so cache invalidations
	// fire regardless of which page is currently mounted.
	const {
		newBooks,
		error: bookFeedError,
		clearFeed: clearBookFeed,
	} = useBookSubscription();
	const {
		newAuthors,
		error: authorFeedError,
		clearFeed: clearAuthorFeed,
	} = useAuthorSubscription();

	return (
		<div className="app">
			<header className="app-header">
				<Link to="/" className="app-logo">
					Library
				</Link>
				<nav className="app-nav">
					<NavLink
						to="/"
						end
						className={({ isActive }) =>
							isActive ? "nav-link active" : "nav-link"
						}
					>
						Books
					</NavLink>
					<NavLink
						to="/authors"
						className={({ isActive }) =>
							isActive ? "nav-link active" : "nav-link"
						}
					>
						Authors
					</NavLink>
					<NavLink
						to="/graphiql"
						className={({ isActive }) =>
							isActive ? "nav-link active" : "nav-link"
						}
					>
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
						<Route
							path="/"
							element={
								<BooksPage
									newBooks={newBooks}
									feedError={bookFeedError}
									clearFeed={clearBookFeed}
								/>
							}
						/>
						<Route
							path="/authors"
							element={
								<AuthorsPage
									newAuthors={newAuthors}
									feedError={authorFeedError}
									clearFeed={clearAuthorFeed}
								/>
							}
						/>
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
