package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlayerCreateRequest(
        @JsonProperty("name") String name,
        @JsonProperty("position") String position,
        @JsonProperty("agility") Integer agility,
        @JsonProperty("age") Integer age,
        @JsonProperty("pace") Integer pace,
        @JsonProperty("shooting") Integer shooting,
        @JsonProperty("passing") Integer passing,
        @JsonProperty("dribbling") Integer dribbling,
        @JsonProperty("defending") Integer defending,
        @JsonProperty("physical") Integer physical,
        @JsonProperty("potential") Integer potential
) {}
