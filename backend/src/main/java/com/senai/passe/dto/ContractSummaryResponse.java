package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ContractSummaryResponse(
        @JsonProperty("purchase_value") BigDecimal purchaseValue,
        @JsonProperty("loyalty_until") OffsetDateTime loyaltyUntil,
        @JsonProperty("status") String status
) {}
