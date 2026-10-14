package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BuyPlayerRequest(
        @JsonProperty("club_id") Long clubId,
        @JsonProperty("loyalty_until") String loyaltyUntil
) {}
