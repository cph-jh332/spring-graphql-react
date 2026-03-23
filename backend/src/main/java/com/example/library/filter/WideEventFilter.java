package com.example.library.filter;

import net.logstash.logback.marker.LogstashMarker;
import net.logstash.logback.marker.Markers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Wide-event WebFilter.
 *
 * <p>Implements the <em>wide event</em> pattern: one comprehensive structured log line
 * is emitted at the end of every HTTP request instead of many scattered log statements.
 *
 * <p>Context is accumulated in the Reactor {@link reactor.util.context.Context} under
 * the key {@link #WIDE_EVENT_KEY} throughout the request pipeline (populated by
 * {@link GraphQlWideEventInterceptor} for GraphQL operations). At completion the filter
 * reads those fields and emits a single {@code INFO} log using Logstash
 * {@link LogstashMarker}s — no MDC thread-locals involved, so fields survive
 * across reactive thread hops.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class WideEventFilter implements WebFilter {

    private static final Logger log = LoggerFactory.getLogger(WideEventFilter.class);

    /** Reactor Context key under which the mutable wide-event field map is stored. */
    public static final String WIDE_EVENT_KEY = "wide_event";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        long startNanos = System.nanoTime();

        // A mutable map that downstream components (e.g. GraphQlWideEventInterceptor)
        // can enrich by retrieving it from the Reactor Context.
        Map<String, String> fields = new HashMap<>();

        return chain.filter(exchange)
                .contextWrite(ctx -> ctx.put(WIDE_EVENT_KEY, fields))
                .doFinally(signalType -> {
                    long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
                    ServerHttpResponse response = exchange.getResponse();

                    // Build a LogstashMarker — fields are embedded directly in the
                    // log event object, bypassing thread-local MDC entirely.
                    LogstashMarker marker = Markers
                            .append("http.method", exchange.getRequest().getMethod().name())
                            .and(Markers.append("http.path", exchange.getRequest().getPath().value()))
                            .and(Markers.append("http.status",
                                    response.getStatusCode() != null
                                            ? response.getStatusCode().value()
                                            : "unknown"))
                            .and(Markers.append("duration_ms", durationMs));

                    // Append any fields added by GraphQlWideEventInterceptor
                    for (Map.Entry<String, String> entry : fields.entrySet()) {
                        marker = marker.and(Markers.append(entry.getKey(), entry.getValue()));
                    }

                    log.info(marker, "request");
                });
    }
}
