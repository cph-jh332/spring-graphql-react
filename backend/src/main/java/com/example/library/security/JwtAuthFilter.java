package com.example.library.security;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Reads the {@code access_token} HttpOnly cookie from every incoming request.
 * If the token is present and valid, the authenticated principal is stored in
 * the reactive security context so that {@code @PreAuthorize} annotations on
 * GraphQL mutation handlers are evaluated correctly.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter implements WebFilter {

    private static final String COOKIE_NAME = "access_token";

    private final JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst(COOKIE_NAME);
        if (cookie == null) {
            return chain.filter(exchange);
        }

        String token = cookie.getValue();
        try {
            if (jwtUtil.isTokenValid(token)) {
                String username = jwtUtil.extractUsername(token);
                var auth = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
                return chain.filter(exchange)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
            }
        } catch (Exception ignored) {
            // Invalid / expired token — continue unauthenticated
        }

        return chain.filter(exchange);
    }
}
