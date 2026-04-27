import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../context/AuthContext";
import { gqlClient } from "../api/client";
import { LOGIN } from "../api/mutations";

export function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsPending(true);
		try {
			const data = await gqlClient.request(LOGIN, {
				input: { username, password },
			});
			login(
				data.login.username,
				data.login.roles,
				(data.login.borrowedRecords ?? []).map((r) => ({ bookId: r.bookId, borrowedAt: r.borrowedAt })),
			);
			navigate("/");
		} catch {
			setError("Invalid username or password.");
		} finally {
			setIsPending(false);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-[calc(100svh-60px)]">
			<div className="w-full max-w-[360px] bg-card border border-border rounded-xl p-8 flex flex-col gap-6">
				<h1 className="text-2xl font-bold text-foreground tracking-tight">
					Sign in
				</h1>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							// biome-ignore lint/jsx-a11y/no-autofocus: login form
							autoFocus
							autoComplete="username"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
						/>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" disabled={isPending} className="w-full mt-1">
						{isPending ? "Signing in…" : "Sign in"}
					</Button>
				</form>
			</div>
		</div>
	);
}
