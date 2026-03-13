import type { Book } from "../api/types";

interface LiveFeedProps {
  newBooks: Book[];
  error: string | null;
  clearFeed: () => void;
}

export function LiveFeed({ newBooks, error, clearFeed }: LiveFeedProps) {
  if (error) {
    return <div className="live-feed live-feed--error">{error}</div>;
  }

  if (newBooks.length === 0) {
    return (
      <div className="live-feed live-feed--idle">
        <span className="live-indicator" /> Listening for new books...
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
        {newBooks.map((book) => (
          <li key={book.id} className="live-feed-item">
            <strong>{book.title}</strong>
            <span className="live-feed-meta">
              {book.author.name} &middot; {book.year}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
