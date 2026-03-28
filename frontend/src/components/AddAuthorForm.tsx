import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gqlClient } from "../api/client";
import { ADD_AUTHOR } from "../api/mutations";

interface AddAuthorFormProps {
	onClose: () => void;
}

export function AddAuthorForm({ onClose }: AddAuthorFormProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");

	const mutation = useMutation({
		mutationFn: (input: { name: string }) =>
			gqlClient.request(ADD_AUTHOR, { input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authors"] });
			onClose();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate({ name });
	};

	return (
		<Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
			<DialogContent className="max-w-[440px]">
				<DialogHeader>
					<DialogTitle>Add New Author</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								placeholder="Author name"
							/>
						</div>
						{mutation.isError && (
							<p className="text-xs text-destructive">
								Failed to add author. Please try again.
							</p>
						)}
					</div>
					<DialogFooter>
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Adding..." : "Add Author"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
