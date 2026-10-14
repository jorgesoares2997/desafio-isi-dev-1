package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MatchClubInfo(
        @JsonProperty("club_id") Long clubId,
        @JsonProperty("club_name") String clubName,
        @JsonProperty("formation") String formation,
        @JsonProperty("goals") Integer goals
) {}
