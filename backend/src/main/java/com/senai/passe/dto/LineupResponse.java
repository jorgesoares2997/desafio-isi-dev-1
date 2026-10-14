package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record LineupResponse(
        @JsonProperty("club_id") Long clubId,
        @JsonProperty("formation") String formation,
        @JsonProperty("complete") boolean complete,
        @JsonProperty("players") List<PlayerResponse> players
) {}
