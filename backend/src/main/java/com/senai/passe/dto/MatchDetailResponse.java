package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;
import java.util.List;

public record MatchDetailResponse(
        @JsonProperty("id") Long id,
        @JsonProperty("played_at") OffsetDateTime playedAt,
        @JsonProperty("home") MatchClubInfo home,
        @JsonProperty("away") MatchClubInfo away,
        @JsonProperty("result") String result,
        @JsonProperty("duels") List<DuelResponse> duels
) {}
