package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ContractInfoResponse(
        @JsonProperty("purchase_value") BigDecimal purchaseValue,
        @JsonProperty("loyalty_until") OffsetDateTime loyaltyUntil,
        @JsonProperty("remaining_days") Integer remainingDays,
        @JsonProperty("penalty_rate") Integer penaltyRate
) {}
