package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LineupRequest(
        @JsonProperty("formation") String formation,
        @JsonProperty("player_ids") List<Long> playerIds
) {}
