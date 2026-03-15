package com.example.library.controller;

import com.example.library.service.BookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/books")
public class ImageUploadController {

    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private final BookService bookService;
    private final Path uploadDir;

    public ImageUploadController(
            BookService bookService,
            @Value("${app.upload.dir:uploads/books}") String uploadDirPath) throws IOException {
        this.bookService = bookService;
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
        log.info("Book cover upload directory: {}", this.uploadDir);
    }

    /**
     * Upload or replace the cover image for a book.
     * <p>
     * {@code POST /api/books/{id}/cover}
     * Content-Type: multipart/form-data, field name: "file"
     *
     * @return JSON {@code {"coverImage": "/uploads/books/<id>.<ext>"}}
     */
    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<Map<String, String>> uploadCover(
            @PathVariable String id,
            @RequestPart("file") FilePart filePart) {

        String contentType = filePart.headers().getContentType() != null
                ? filePart.headers().getContentType().toString()
                : "";

        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return Mono.error(new IllegalArgumentException(
                    "Unsupported image type: " + contentType + ". Allowed: jpeg, png, webp"));
        }

        String ext = extensionFor(contentType);
        String filename = id + ext;
        Path dest = uploadDir.resolve(filename);

        // Delete any previous cover (different extension) before writing
        deleteExistingCovers(id);

        return filePart.transferTo(dest)
                .then(bookService.updateCoverImage(id, "/uploads/books/" + filename))
                .map(book -> Map.of("coverImage", book.getCoverImage()))
                .doOnNext(r -> log.debug("Saved cover for book {}: {}", id, dest));
    }

    /**
     * Remove the cover image for a book.
     * <p>
     * {@code DELETE /api/books/{id}/cover}
     */
    @DeleteMapping("/{id}/cover")
    public Mono<Map<String, Boolean>> deleteCover(@PathVariable String id) {
        deleteExistingCovers(id);
        return bookService.updateCoverImage(id, null)
                .thenReturn(Map.of("deleted", true));
    }

    // ---- helpers ----

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private void deleteExistingCovers(String id) {
        for (String ext : new String[]{".jpg", ".png", ".webp"}) {
            Path p = uploadDir.resolve(id + ext);
            try {
                Files.deleteIfExists(p);
            } catch (IOException e) {
                log.warn("Could not delete old cover {}: {}", p, e.getMessage());
            }
        }
    }
}
