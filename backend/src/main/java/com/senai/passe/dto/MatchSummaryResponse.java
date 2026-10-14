package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;

public record MatchSummaryResponse(
        @JsonProperty("id") Long id,
        @JsonProperty("played_at") OffsetDateTime playedAt,
        @JsonProperty("home") MatchClubInfo home,
        @JsonProperty("away") MatchClubInfo away,
        @JsonProperty("result") String result
) {}
