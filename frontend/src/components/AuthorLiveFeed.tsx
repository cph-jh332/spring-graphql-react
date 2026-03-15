import type { OnAuthorAddedSubscription } from "../gql/graphql";

type Author = OnAuthorAddedSubscription["authorAdded"];

interface AuthorLiveFeedProps {
  newAuthors: Author[];
  error: string | null;
  clearFeed: () => void;
}

export function AuthorLiveFeed({ newAuthors, error, clearFeed }: AuthorLiveFeedProps) {
  if (error) {
    return <div className="live-feed live-feed--error">{error}</div>;
  }

  if (newAuthors.length === 0) {
    return (
      <div className="live-feed live-feed--idle">
        <span className="live-indicator" /> Listening for new authors...
      </div>
    );
  }

  return (
    <div className="live-feed live-feed--active">
      <div className="live-feed-header">
        <div>
          <span className="live-indicator live-indicator--pulse" /> Live Feed
        </div>
        <button className="btn-clear" onClick={clearFeed}>
          Clear
        </button>
      </div>
      <ul className="live-feed-list">
        {newAuthors.map((author) => (
          <li key={author.id} className="live-feed-item">
            <strong>{author.name}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
