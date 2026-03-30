import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ReactNode } from "react";

const API_BASE =
	import.meta.env.VITE_API_URL ??
	`${window.location.protocol}//${window.location.host}`;

interface AuthUser {
	username: string;
}

interface AuthContextValue {
	user: AuthUser | null;
	isAuthenticated: boolean;
	/** Call after a successful login response to store the username in state. */
	login: (username: string) => void;
	logout: () => Promise<void>;
	/** True while the initial /me check is in flight (prevents flash of unauthenticated UI). */
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// On mount, try to restore the session by asking the backend if the
	// access_token cookie is still valid.
	useEffect(() => {
		fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
			.then((res) => (res.ok ? res.json() : null))
			.then((data: { username: string } | null) => {
				if (data?.username) setUser({ username: data.username });
			})
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, []);

	const login = useCallback((username: string) => {
		setUser({ username });
	}, []);

	const logout = useCallback(async () => {
		await fetch(`${API_BASE}/api/auth/logout`, {
			method: "POST",
			credentials: "include",
		}).catch(() => {});
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider
			value={{ user, isAuthenticated: user !== null, login, logout, isLoading }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
	return ctx;
}
