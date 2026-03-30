import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	BrowserRouter,
	Link,
	NavLink,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useAuthorSubscription } from "./hooks/useAuthorSubscription";
import { useBookSubscription } from "./hooks/useBookSubscription";
import { AuthorsPage } from "./pages/AuthorsPage";
import { BooksPage } from "./pages/BooksPage";
import { GraphiQLPage } from "./pages/GraphiQLPage";
import { LoginPage } from "./pages/LoginPage";
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
	const { user, isAuthenticated, logout } = useAuth();

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
		<div className="flex flex-col min-h-svh bg-background">
			<header className="flex items-center justify-between px-8 h-[60px] bg-card border-b border-border sticky top-0 z-50">
				<Link
					to="/"
					className="text-lg font-bold text-foreground tracking-tight no-underline"
				>
					Library
				</Link>
				<nav className="flex items-center gap-1">
					{(
						[
							{ to: "/", label: "Books", end: true },
							{ to: "/authors", label: "Authors", end: false },
							{ to: "/graphiql", label: "GraphiQL", end: false },
						] as const
					).map(({ to, label, end }) => (
						<NavLink
							key={to}
							to={to}
							end={end}
							className={({ isActive }) =>
								cn(
									"px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors no-underline",
									isActive
										? "text-[#818cf8] bg-[rgba(99,102,241,0.15)]"
										: "text-muted-foreground hover:text-foreground hover:bg-secondary",
								)
							}
						>
							{label}
						</NavLink>
					))}

					{/* Auth section */}
					<div className="ml-3 flex items-center gap-2 pl-3 border-l border-border">
						{isAuthenticated ? (
							<>
								<span className="text-xs text-muted-foreground hidden sm:block">
									{user?.username}
								</span>
								<button
									type="button"
									onClick={() => logout()}
									className="px-3.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
								>
									Log out
								</button>
							</>
						) : (
							<NavLink
								to="/login"
								className={({ isActive }) =>
									cn(
										"px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors no-underline",
										isActive
											? "text-[#818cf8] bg-[rgba(99,102,241,0.15)]"
											: "text-muted-foreground hover:text-foreground hover:bg-secondary",
									)
								}
							>
								Log in
							</NavLink>
						)}
					</div>
				</nav>
			</header>
			{isGraphiQL ? (
				<Routes>
					<Route path="/graphiql" element={<GraphiQLPage />} />
				</Routes>
			) : (
				<main className="flex-1 px-8 py-8 max-w-[1200px] w-full mx-auto">
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
						<Route path="/login" element={<LoginPage />} />
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
				<AuthProvider>
					<Layout />
				</AuthProvider>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
