package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BookInput(
        @NotBlank String title,
        @Min(1) int year,
        @NotBlank String authorId,
        @Min(1) int totalCopies
) {}
