import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../api/client";
import { GET_USERS } from "../api/queries";
import { DELETE_USER, UPDATE_USER, CREATE_USER } from "../api/mutations";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import { Role } from "../gql/graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type UserRow = { username: string; roles: Role[] };

// ── Add User Dialog ───────────────────────────────────────────────────────────

function AddUserDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<Role>(Role.Member);
	const [error, setError] = useState<string | null>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: () =>
			gqlClient.request(CREATE_USER, { input: { username, password, role } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
			setUsername("");
			setPassword("");
			setRole(Role.Member);
			setError(null);
			onClose();
		},
		onError: (err: Error) => {
			setError(err.message ?? "Failed to create user.");
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		mutate();
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Add user</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="add-username">Username</Label>
						<Input
							id="add-username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							autoFocus
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="add-password">Password</Label>
						<Input
							id="add-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>Role</Label>
						<Select
							value={role}
							onValueChange={(v) => setRole(v as Role)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={Role.Member}>Member</SelectItem>
								<SelectItem value={Role.Librarian}>Librarian</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Creating…" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ── Edit User Dialog ──────────────────────────────────────────────────────────

function EditUserDialog({
	user,
	onClose,
}: {
	user: UserRow | null;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const [role, setRole] = useState<Role>(user?.roles[0] ?? Role.Member);
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: () =>
			gqlClient.request(UPDATE_USER, {
				input: {
					username: user!.username,
					role,
					newPassword: newPassword || null,
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
			setError(null);
			onClose();
		},
		onError: (err: Error) => {
			setError(err.message ?? "Failed to update user.");
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		mutate();
	}

	return (
		<Dialog open={user !== null} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Edit user — {user?.username}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
					<div className="flex flex-col gap-1.5">
						<Label>Role</Label>
						<Select
							value={role}
							onValueChange={(v) => setRole(v as Role)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={Role.Member}>Member</SelectItem>
								<SelectItem value={Role.Librarian}>Librarian</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="edit-password">
							New password{" "}
							<span className="text-muted-foreground text-xs">(leave blank to keep)</span>
						</Label>
						<Input
							id="edit-password"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							autoComplete="new-password"
						/>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving…" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ── UsersPage ─────────────────────────────────────────────────────────────────

export function UsersPage() {
	const { user: currentUser, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [showAddDialog, setShowAddDialog] = useState(false);
	const [editTarget, setEditTarget] = useState<UserRow | null>(null);

	// Guard: only librarians can access this page
	const isLibrarian = currentUser?.roles.includes(Role.Librarian);
	if (!isAuthenticated || !isLibrarian) {
		navigate("/");
		return null;
	}

	const { data, isLoading, isError } = useQuery({
		queryKey: queryKeys.users.all,
		queryFn: () => gqlClient.request(GET_USERS),
	});

	const { mutate: deleteUser } = useMutation({
		mutationFn: (username: string) =>
			gqlClient.request(DELETE_USER, { username }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
	});

	const users: UserRow[] = data?.users ?? [];

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Users</h1>
				<Button onClick={() => setShowAddDialog(true)}>+ Add user</Button>
			</div>

			{/* Table */}
			{isLoading && (
				<p className="text-muted-foreground text-sm">Loading users…</p>
			)}
			{isError && (
				<p className="text-destructive text-sm">Failed to load users.</p>
			)}
			{!isLoading && !isError && users.length === 0 && (
				<p className="text-muted-foreground text-sm">No users found.</p>
			)}
			{!isLoading && !isError && users.length > 0 && (
				<div className="rounded-xl border border-border overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-muted/50 text-muted-foreground">
								<th className="text-left px-4 py-3 font-medium">Username</th>
								<th className="text-left px-4 py-3 font-medium">Role</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody>
							{users.map((u, i) => {
								const isSelf = u.username === currentUser?.username;
								return (
									<tr
										key={u.username}
										className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}
									>
										<td className="px-4 py-3 font-medium">{u.username}</td>
										<td className="px-4 py-3">
											<Badge
												variant={
													u.roles.includes(Role.Librarian)
														? "default"
														: "outline"
												}
											>
												{u.roles.includes(Role.Librarian)
													? "Librarian"
													: "Member"}
											</Badge>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-2">
												<Button
													size="sm"
													variant="ghost"
													disabled={isSelf}
													onClick={() => setEditTarget(u)}
												>
													Edit
												</Button>
												<Button
													size="sm"
													variant="ghost"
													disabled={isSelf}
													className="text-destructive hover:text-destructive"
													onClick={() => {
														if (
															confirm(
																`Delete user "${u.username}"? This cannot be undone.`,
															)
														) {
															deleteUser(u.username);
														}
													}}
												>
													Delete
												</Button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Dialogs */}
			<AddUserDialog
				open={showAddDialog}
				onClose={() => setShowAddDialog(false)}
			/>
			<EditUserDialog
				user={editTarget}
				onClose={() => setEditTarget(null)}
			/>
		</div>
	);
}
