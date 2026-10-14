package com.senai.passe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TransactionsListResponse(
        @JsonProperty("data") List<TransactionResponse> data,
        @JsonProperty("summary") TransactionsSummary summary
) {}
