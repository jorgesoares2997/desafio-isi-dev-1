package com.senai.passe.service.dto;

import java.math.BigDecimal;

public record TaxaCompraResult(
        BigDecimal valorMercado,
        BigDecimal taxa,
        BigDecimal custoTotal,
        BigDecimal limite50Caixa,
        boolean permitido
) {}
