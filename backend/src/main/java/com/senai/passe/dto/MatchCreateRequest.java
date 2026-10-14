package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MatchCreateRequest(
        @JsonProperty("home_club_id") Long homeClubId,
        @JsonProperty("away_club_id") Long awayClubId
) {}
