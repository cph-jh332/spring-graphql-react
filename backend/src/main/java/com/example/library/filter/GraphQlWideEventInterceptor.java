package com.example.library.filter;

import graphql.language.Argument;
import graphql.language.BooleanValue;
import graphql.language.Field;
import graphql.language.FloatValue;
import graphql.language.IntValue;
import graphql.language.NullValue;
import graphql.language.ObjectField;
import graphql.language.ObjectValue;
import graphql.language.OperationDefinition;
import graphql.language.StringValue;
import graphql.language.Value;
import graphql.language.VariableReference;
import graphql.parser.Parser;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Wide-event GraphQL interceptor.
 *
 * <p>
 * Enriches the Reactor Context's wide-event field map (keyed by
 * {@link WideEventFilter#WIDE_EVENT_KEY}) with GraphQL-specific context so that
 * the outer {@link WideEventFilter} can include those fields in the single
 * emitted
 * log line.
 *
 * <p>
 * Fields added:
 * <ul>
 * <li>{@code graphql.operation} – {@code query}, {@code mutation}, or
 * {@code subscription}</li>
 * <li>{@code graphql.field} – the first root-level field name (e.g.
 * {@code books}, {@code addBook})</li>
 * <li>{@code graphql.args.*} – flattened arguments from the root field,
 * resolved
 * against the variables map. E.g. {@code graphql.args.query},
 * {@code graphql.args.input.title}, {@code graphql.args.id}.</li>
 * <li>{@code graphql.error_count} – number of GraphQL errors in the response
 * (omitted when zero)</li>
 * <li>{@code error.message} / {@code error.type} – first error detail when
 * errors are present</li>
 * </ul>
 */
@Component
public class GraphQlWideEventInterceptor implements WebGraphQlInterceptor {

    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        return chain.next(request)
                .flatMap(response -> Mono.deferContextual(ctx -> {
                    if (!ctx.hasKey(WideEventFilter.WIDE_EVENT_KEY)) {
                        return Mono.just(response);
                    }

                    @SuppressWarnings("unchecked")
                    Map<String, String> fields = (Map<String, String>) ctx.get(WideEventFilter.WIDE_EVENT_KEY);

                    // Parse the raw document string to extract operation type, root field, and args
                    try {
                        String documentText = request.getDocument();
                        if (documentText != null && !documentText.isBlank()) {
                            var document = Parser.parse(documentText);
                            Map<String, Object> variables = request.getVariables();

                            document.getDefinitions().stream()
                                    .filter(d -> d instanceof OperationDefinition)
                                    .map(d -> (OperationDefinition) d)
                                    .findFirst()
                                    .ifPresent(op -> {
                                        OperationDefinition.Operation opType = op.getOperation();
                                        fields.put("graphql.operation",
                                                opType != null ? opType.name().toLowerCase() : "query");

                                        var selections = op.getSelectionSet().getSelections();
                                        if (!selections.isEmpty()
                                                && selections.get(0) instanceof Field rootField) {
                                            fields.put("graphql.field", rootField.getName());

                                            // Flatten all arguments of the root field into the wide event
                                            for (Argument arg : rootField.getArguments()) {
                                                flattenValue(
                                                        "graphql.args." + arg.getName(),
                                                        arg.getValue(),
                                                        variables,
                                                        fields);
                                            }
                                        }
                                    });
                        }
                    } catch (Exception ignored) {
                        // Malformed document — still emit the wide event without graphql fields
                    }

                    // Error count and first error details
                    int errorCount = response.getErrors().size();
                    if (errorCount > 0) {
                        fields.put("graphql.error_count", String.valueOf(errorCount));
                        response.getErrors().stream().findFirst().ifPresent(e -> {
                            fields.put("error.message", e.getMessage());
                            fields.put("error.type",
                                    e.getErrorType() != null ? e.getErrorType().toString() : "unknown");
                        });
                    }

                    return Mono.just(response);
                }));
    }

    /**
     * Recursively flattens a GraphQL AST {@link Value} into the fields map using
     * dot-separated keys. Variable references are resolved against the variables
     * map.
     *
     * <p>
     * Examples:
     * 
     * <pre>
     *   query=hello           → graphql.args.query = "hello"
     *   id=42                 → graphql.args.id = "42"
     *   input={title:"X",...} → graphql.args.input.title = "X"
     *                           graphql.args.input.year  = "2024"
     *                           graphql.args.input.authorId = "abc"
     * </pre>
     */
    @SuppressWarnings("unchecked")
    private void flattenValue(String key, Value<?> value, Map<String, Object> variables,
            Map<String, String> out) {
        if (value instanceof StringValue sv) {
            out.put(key, sv.getValue());
        } else if (value instanceof IntValue iv) {
            out.put(key, iv.getValue().toString());
        } else if (value instanceof FloatValue fv) {
            out.put(key, fv.getValue().toString());
        } else if (value instanceof BooleanValue bv) {
            out.put(key, String.valueOf(bv.isValue()));
        } else if (value instanceof NullValue) {
            out.put(key, "null");
        } else if (value instanceof ObjectValue ov) {
            // Inline input object — recurse into each field
            for (ObjectField field : ov.getObjectFields()) {
                flattenValue(key + "." + field.getName(), field.getValue(), variables, out);
            }
        } else if (value instanceof VariableReference var) {
            // Variable reference — resolve from the variables map
            Object resolved = variables.get(var.getName());
            if (resolved instanceof Map<?, ?> nestedMap) {
                flattenMap(key, (Map<String, Object>) nestedMap, out);
            } else if (resolved != null) {
                out.put(key, resolved.toString());
            }
        }
        // EnumValue, ListValue, etc. — omitted; not used by this schema
    }

    /**
     * Recursively flattens a plain {@link Map} (from the variables map) into
     * dot-keys.
     */
    @SuppressWarnings("unchecked")
    private void flattenMap(String prefix, Map<String, Object> map, Map<String, String> out) {
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String key = prefix + "." + entry.getKey();
            Object val = entry.getValue();
            if (val instanceof Map<?, ?> nested) {
                flattenMap(key, (Map<String, Object>) nested, out);
            } else if (val != null) {
                out.put(key, val.toString());
            }
        }
    }
}
