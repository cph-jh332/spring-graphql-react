import { explorerPlugin } from "@graphiql/plugin-explorer";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import "graphiql/style.css";
import "@graphiql/plugin-explorer/style.css";

const fetcher = createGraphiQLFetcher({
	url: `${window.location.protocol}//${window.location.host}/graphql`,
	subscriptionUrl: `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/graphql`,
});

const explorer = explorerPlugin({ showAttribution: false });

export function GraphiQLPage() {
	return (
		<div style={{ height: "100vh" }}>
			<GraphiQL fetcher={fetcher} plugins={[explorer]} />
		</div>
	);
}
