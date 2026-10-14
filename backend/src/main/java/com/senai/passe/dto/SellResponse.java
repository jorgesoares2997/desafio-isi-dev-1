package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SellResponse(
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
        @JsonProperty("purchase_value") BigDecimal purchaseValue,
        @JsonProperty("remaining_days") Integer remainingDays,
        @JsonProperty("penalty_rate") Integer penaltyRate,
        @JsonProperty("contract_status") String contractStatus,
        @JsonProperty("club_cash") BigDecimal clubCash
) {}
