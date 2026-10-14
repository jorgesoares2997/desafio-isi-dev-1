package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record TransactionsSummary(
        @JsonProperty("total_spent") BigDecimal totalSpent,
        @JsonProperty("total_received") BigDecimal totalReceived,
        @JsonProperty("total_fees") BigDecimal totalFees,
        @JsonProperty("total_penalties") BigDecimal totalPenalties,
        @JsonProperty("total_profit") BigDecimal totalProfit
) {}
