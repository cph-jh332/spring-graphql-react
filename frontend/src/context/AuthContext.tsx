import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ReactNode } from "react";
import { gqlClient } from "../api/client";
import { ME } from "../api/queries";
import { LOGOUT } from "../api/mutations";
import type { Role } from "../gql/graphql";

export interface BorrowRecord {
	bookId: string;
	borrowedAt: string; // ISO-8601 instant string from backend
}

interface AuthUser {
	username: string;
	roles: Role[];
	borrowedRecords: BorrowRecord[];
}

interface AuthContextValue {
	user: AuthUser | null;
	isAuthenticated: boolean;
	/** Call after a successful login response to store the user in state. */
	login: (username: string, roles: Role[], borrowedRecords: BorrowRecord[]) => void;
	logout: () => Promise<void>;
	/** Re-fetches the current user's me data and updates state (e.g. after borrow/return). */
	refreshUser: () => Promise<void>;
	/** True while the initial me check is in flight (prevents flash of unauthenticated UI). */
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toRecords(raw: Array<{ bookId: string; borrowedAt: string }> | null | undefined): BorrowRecord[] {
	return (raw ?? []).map((r) => ({ bookId: r.bookId, borrowedAt: r.borrowedAt }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// On mount, try to restore session by asking the backend via GraphQL me query.
	useEffect(() => {
		gqlClient
			.request(ME)
			.then((data) => {
				if (data.me?.username) {
					setUser({
						username: data.me.username,
						roles: data.me.roles,
						borrowedRecords: toRecords(data.me.borrowedRecords),
					});
				}
			})
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, []);

	const login = useCallback((username: string, roles: Role[], borrowedRecords: BorrowRecord[]) => {
		setUser({ username, roles, borrowedRecords });
	}, []);

	const logout = useCallback(async () => {
		await gqlClient.request(LOGOUT).catch(() => {});
		setUser(null);
	}, []);

	const refreshUser = useCallback(async () => {
		try {
			const data = await gqlClient.request(ME);
			if (data.me?.username) {
				setUser({
					username: data.me.username,
					roles: data.me.roles,
					borrowedRecords: toRecords(data.me.borrowedRecords),
				});
			}
		} catch {
			// ignore
		}
	}, []);

	return (
		<AuthContext.Provider
			value={{ user, isAuthenticated: user !== null, login, logout, refreshUser, isLoading }}
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
