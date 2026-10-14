package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DuelResponse(
        @JsonProperty("order") Integer order,
        @JsonProperty("attacking_club_id") Long attackingClubId,
        @JsonProperty("attacker") DuelParticipantDto attacker,
        @JsonProperty("defender") DuelParticipantDto defender,
        @JsonProperty("goal") Boolean goal
) {}
