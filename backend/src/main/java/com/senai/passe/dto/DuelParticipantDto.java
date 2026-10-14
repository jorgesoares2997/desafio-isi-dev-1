package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DuelParticipantDto(
        @JsonProperty("player_id") Long playerId,
        @JsonProperty("player_name") String playerName,
        @JsonProperty("position") String position,
        @JsonProperty("condition") String condition,
        @JsonProperty("attribute") String attribute,
        @JsonProperty("value") Integer value
) {}
