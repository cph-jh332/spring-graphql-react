package com.example.library.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

import java.nio.file.Paths;

/**
 * Maps the URL path /uploads/** to the filesystem directory where
 * uploaded book cover images are stored.
 *
 * Spring WebFlux resolves a request for /uploads/books/abc.jpg by
 * stripping the handler pattern prefix (/uploads/) and looking for
 * books/abc.jpg inside the configured resource location.
 *
 * So the location must be set to file:<uploadDir-parent>/, i.e.
 * the parent of "books/", which is the "uploads/" directory itself.
 */
@Configuration
public class StaticResourceConfig implements WebFluxConfigurer {

    private final String uploadDir;

    public StaticResourceConfig(@Value("${app.upload.dir:uploads/books}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve the parent of the configured upload dir (e.g. "uploads/books" → "uploads/")
        String location = "file:" + Paths.get(uploadDir).toAbsolutePath().getParent() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
