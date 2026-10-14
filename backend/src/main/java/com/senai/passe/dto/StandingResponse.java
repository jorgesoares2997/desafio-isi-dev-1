package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StandingResponse(
        @JsonProperty("position") Integer position,
        @JsonProperty("club_id") Long clubId,
        @JsonProperty("club_name") String clubName,
        @JsonProperty("played") Integer played,
        @JsonProperty("wins") Integer wins,
        @JsonProperty("draws") Integer draws,
        @JsonProperty("losses") Integer losses,
        @JsonProperty("goals_for") Integer goalsFor,
        @JsonProperty("goals_against") Integer goalsAgainst,
        @JsonProperty("goal_difference") Integer goalDifference,
        @JsonProperty("points") Integer points
) {}
