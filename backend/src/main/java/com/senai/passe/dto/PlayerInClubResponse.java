package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record PlayerInClubResponse(
        @JsonProperty("id") Long id,
        @JsonProperty("name") String name,
        @JsonProperty("position") String position,
        @JsonProperty("agility") Integer agility,
        @JsonProperty("age") Integer age,
        @JsonProperty("condition") String condition,
        @JsonProperty("base_value") BigDecimal baseValue,
        @JsonProperty("market_value") BigDecimal marketValue,
        @JsonProperty("pace") Integer pace,
        @JsonProperty("shooting") Integer shooting,
        @JsonProperty("passing") Integer passing,
        @JsonProperty("dribbling") Integer dribbling,
        @JsonProperty("defending") Integer defending,
        @JsonProperty("physical") Integer physical,
        @JsonProperty("potential") Integer potential,
        @JsonProperty("overall") Integer overall,
        @JsonProperty("club_id") Long clubId,
        @JsonProperty("contract") ContractInfoResponse contract
) {}
