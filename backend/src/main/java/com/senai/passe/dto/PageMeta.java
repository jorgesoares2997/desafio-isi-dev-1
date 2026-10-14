package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PageMeta(
        @JsonProperty("page") int page,
        @JsonProperty("limit") int limit,
        @JsonProperty("total_items") long totalItems,
        @JsonProperty("total_pages") int totalPages
) {}
