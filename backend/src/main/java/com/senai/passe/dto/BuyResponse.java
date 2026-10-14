package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record BuyResponse(
        @JsonProperty("id") Long id,
        @JsonProperty("club_id") Long clubId,
        @JsonProperty("player_id") Long playerId,
        @JsonProperty("player_name") String playerName,
        @JsonProperty("type") String type,
        @JsonProperty("value") BigDecimal value,
        @JsonProperty("fee") BigDecimal fee,
        @JsonProperty("penalty") BigDecimal penalty,
        @JsonProperty("profit") BigDecimal profit,
        @JsonProperty("cash_change") BigDecimal cashChange,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("contract") ContractSummaryResponse contract,
        @JsonProperty("club_cash") BigDecimal clubCash
) {}
