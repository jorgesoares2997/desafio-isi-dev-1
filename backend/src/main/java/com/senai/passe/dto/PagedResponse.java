package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PagedResponse<T>(
        @JsonProperty("data") List<T> data,
        @JsonProperty("meta") PageMeta meta
) {}
