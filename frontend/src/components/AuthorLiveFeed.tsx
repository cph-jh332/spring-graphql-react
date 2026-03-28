import type { OnAuthorAddedSubscription } from "../gql/graphql";

type Author = OnAuthorAddedSubscription["authorAdded"];

interface AuthorLiveFeedProps {
	newAuthors: Author[];
	error: string | null;
	clearFeed: () => void;
}

export function AuthorLiveFeed({
	newAuthors,
	error,
	clearFeed,
}: AuthorLiveFeedProps) {
	if (error) {
		return (
			<div className="rounded-md border border-destructive bg-card px-4 py-3 mb-6 text-sm text-destructive">
				{error}
			</div>
		);
	}

	if (newAuthors.length === 0) {
		return (
			<div className="rounded-md border border-border bg-card px-4 py-3 mb-6 text-sm text-muted-foreground flex items-center gap-2">
				<span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
				Listening for new authors...
			</div>
		);
	}

	return (
		<div className="rounded-md border border-primary/40 bg-card px-4 py-3 mb-6 text-sm">
			<div className="flex items-center justify-between font-semibold text-foreground mb-2.5">
				<div className="flex items-center gap-2">
					<span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
					Live Feed
				</div>
				<button
					type="button"
					className="text-xs text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer px-2 py-0.5"
					onClick={clearFeed}
				>
					Clear
				</button>
			</div>
			<ul className="m-0 p-0 list-none flex flex-col gap-1.5">
				{newAuthors.map((author) => (
					<li
						key={author.id}
						className="flex items-center px-2.5 py-1.5 bg-secondary rounded-md animate-slide-in"
					>
						<strong>{author.name}</strong>
					</li>
				))}
			</ul>
		</div>
	);
}
