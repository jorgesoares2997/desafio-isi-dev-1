package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public record ClubDetailResponse(
        @JsonProperty("id") Long id,
        @JsonProperty("name") String name,
        @JsonProperty("acronym") String acronym,
        @JsonProperty("cash") BigDecimal cash,
        @JsonProperty("squad_value") BigDecimal squadValue,
        @JsonProperty("net_worth") BigDecimal netWorth,
        @JsonProperty("players") List<PlayerInClubResponse> players
) {}
