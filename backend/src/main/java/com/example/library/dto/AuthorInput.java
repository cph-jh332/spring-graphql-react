package com.example.library.dto;

import jakarta.validation.constraints.NotBlank;

public record AuthorInput(
        @NotBlank String name
) {}
