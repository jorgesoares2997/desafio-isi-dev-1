package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlayerUpdateRequest(
        @JsonProperty("name") String name,
        @JsonProperty("position") String position,
        @JsonProperty("agility") Integer agility,
        @JsonProperty("age") Integer age
) {}
